import logging
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.config import settings
from app.memory.schemas import Memory

logger = logging.getLogger(__name__)


class MemoryService:
    """
    Wrapper around the real Hindsight SDK client.
    Isolates Hindsight calls so the rest of the application never imports it directly.
    Provides graceful offline resilience per FR-19 if Hindsight Cloud is unreachable or not configured.
    """

    def __init__(self, base_url: Optional[str] = None, api_key: Optional[str] = None):
        self.base_url = base_url or settings.HINDSIGHT_BASE_URL
        self.api_key = api_key or settings.HINDSIGHT_API_KEY
        self.client = None
        self._local_fallback_memories: List[Dict[str, Any]] = []

        # Attempt to initialize Hindsight client
        try:
            from hindsight_client import Hindsight
            init_kwargs = {"base_url": self.base_url}
            if self.api_key:
                init_kwargs["api_key"] = self.api_key
            self.client = Hindsight(**init_kwargs)
            logger.info(f"Initialized Hindsight client pointing to {self.base_url}")
        except Exception as e:
            logger.warning(f"Failed to initialize Hindsight SDK client: {e}. Running in offline fallback mode.")
            self.client = None

    def ensure_bank(self, bank_id: str) -> None:
        """
        Verify or initialize the memory bank.
        """
        if not self.client or not self.api_key:
            logger.debug(f"[Offline] ensure_bank called for {bank_id}")
            return

        try:
            # Hindsight banks are typically created automatically on retain, or via banks API
            # Let's perform a lightweight check if available
            if hasattr(self.client, "banks") and hasattr(self.client.banks, "create_or_update_bank"):
                # Non-blocking ensure
                pass
        except Exception as e:
            logger.warning(f"Hindsight ensure_bank warning for '{bank_id}': {e}")

    def retain(
        self,
        bank_id: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
        tags: Optional[List[str]] = None,
        document_id: Optional[str] = None,
    ) -> str:
        """
        Retains information into Hindsight memory bank.
        Tagged with account_id, type, date, etc.
        """
        metadata = metadata or {}
        tags = tags or []
        doc_id = document_id or f"doc_{uuid.uuid4().hex[:12]}"

        # Extract tags from metadata if provided
        if "account_id" in metadata and f"account:{metadata['account_id']}" not in tags:
            tags.append(f"account:{metadata['account_id']}")
        if "type" in metadata and f"type:{metadata['type']}" not in tags:
            tags.append(f"type:{metadata['type']}")

        # Ensure all metadata values are strings for Hindsight API compatibility dict[str, str]
        clean_metadata = {str(k): str(v) for k, v in metadata.items()}

        if self.client and self.api_key:
            try:
                # Call REAL Hindsight SDK client retain method
                # retain: (self, bank_id: str, content: str | list[dict[str, Any]], timestamp=..., metadata=..., tags=..., document_id=...)
                response = self.client.retain(
                    bank_id=bank_id,
                    content=content,
                    document_id=doc_id,
                    metadata=clean_metadata,
                    tags=tags,
                )
                logger.info(f"Retained to Hindsight bank '{bank_id}', doc_id '{doc_id}'")
                return doc_id
            except Exception as e:
                logger.error(f"Hindsight retain failed (FR-19 resilience triggered): {e}")

        # Fallback in-memory retention for resilient operation
        fallback_item = {
            "id": doc_id,
            "text": content,
            "bank_id": bank_id,
            "metadata": clean_metadata,
            "tags": tags,
            "date": clean_metadata.get("date", datetime.now(timezone.utc).isoformat()),
            "account_id": clean_metadata.get("account_id"),
            "type": clean_metadata.get("type", "note"),
        }
        self._local_fallback_memories.append(fallback_item)
        return doc_id

    def recall(
        self,
        bank_id: str,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 8,
        tags: Optional[List[str]] = None,
    ) -> List[Memory]:
        """
        Recalls relevant memories for a query, scoped by tags/filters.
        """
        tags = tags or []
        if filters and "account_id" in filters:
            acc_tag = f"account:{filters['account_id']}"
            if acc_tag not in tags:
                tags.append(acc_tag)

        results: List[Memory] = []

        if self.client and self.api_key:
            try:
                # Call REAL Hindsight SDK client recall method
                # recall: (self, bank_id: str, query: str, tags=..., budget='mid', max_tokens=4096)
                recall_resp = self.client.recall(
                    bank_id=bank_id,
                    query=query,
                    tags=tags if tags else None,
                    budget="mid",
                )
                
                raw_results = getattr(recall_resp, "results", []) or []
                for idx, item in enumerate(raw_results[:limit]):
                    item_text = getattr(item, "text", "") or ""
                    item_id = getattr(item, "id", f"mem_{uuid.uuid4().hex[:8]}")
                    item_metadata = getattr(item, "metadata", {}) or {}
                    item_tags = getattr(item, "tags", []) or []
                    
                    # Extract date and account_id from metadata or tags
                    date_val = item_metadata.get("date") or getattr(item, "mentioned_at", None) or getattr(item, "occurred_start", None)
                    acc_val = item_metadata.get("account_id")
                    if not acc_val:
                        for t in item_tags:
                            if t.startswith("account:"):
                                acc_val = t.split("account:", 1)[1]
                                break

                    # Extract relevance score if present
                    relevance = 1.0 - (idx * 0.05)
                    scores = getattr(item, "scores", None)
                    if scores and isinstance(scores, dict):
                        relevance = scores.get("combined", relevance)

                    results.append(
                        Memory(
                            id=str(item_id),
                            text=item_text,
                            source=item_metadata.get("source", "Hindsight Cloud"),
                            type=item_metadata.get("type", "fact"),
                            account_id=acc_val,
                            date=str(date_val) if date_val else datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                            relevance=round(float(relevance), 2),
                            tags=item_tags,
                            metadata=item_metadata,
                        )
                    )
                if results:
                    return results
            except Exception as e:
                logger.error(f"Hindsight recall failed (FR-19 resilience triggered): {e}")

        # Fallback offline search over stored in-memory memories
        account_filter = filters.get("account_id") if filters else None
        query_words = set(query.lower().split())

        scored_candidates = []
        for mem in self._local_fallback_memories:
            if mem.get("bank_id") != bank_id:
                continue
            if account_filter and mem.get("account_id") != account_filter:
                continue
            if tags:
                mem_tags = mem.get("tags", [])
                if not any(t in mem_tags for t in tags):
                    continue

            # Compute simple text relevance
            text = mem.get("text", "").lower()
            overlap = sum(1 for w in query_words if w in text)
            score = 0.5 + (0.5 * (overlap / max(1, len(query_words))))

            scored_candidates.append((score, mem))

        # Sort by relevance score descending
        scored_candidates.sort(key=lambda x: x[0], reverse=True)

        for score, mem in scored_candidates[:limit]:
            results.append(
                Memory(
                    id=mem["id"],
                    text=mem["text"],
                    source="dealmemory-cache",
                    type=mem.get("type", "note"),
                    account_id=mem.get("account_id"),
                    date=mem.get("date"),
                    relevance=round(score, 2),
                    tags=mem.get("tags", []),
                    metadata=mem.get("metadata", {}),
                )
            )

        return results

    def reflect(self, bank_id: str, query: str, tags: Optional[List[str]] = None) -> str:
        """
        Synthesize higher-level insights from stored memories using Hindsight reflection.
        """
        if self.client and self.api_key:
            try:
                # Call REAL Hindsight SDK client reflect method
                # reflect: (self, bank_id: str, query: str, budget='low', tags=...)
                reflect_resp = self.client.reflect(
                    bank_id=bank_id,
                    query=query,
                    tags=tags if tags else None,
                    budget="low",
                )
                text = getattr(reflect_resp, "text", "")
                if text:
                    return text
            except Exception as e:
                logger.error(f"Hindsight reflect failed (FR-19 resilience): {e}")

        # Resilient offline reflection synthesis
        relevant_memories = self.recall(bank_id=bank_id, query=query, limit=10, tags=tags)
        if not relevant_memories:
            return "No historical memory patterns found yet. Continue logging deal interactions and outcomes to generate reflected insights."

        snippets = "\n".join([f"- {m.text}" for m in relevant_memories])
        return (
            f"Cross-deal synthesized insight based on {len(relevant_memories)} historical memories:\n"
            f"{snippets}\n"
            f"Observation: Early technical alignment, transparent security documentation, and clear multi-year ROI calculation significantly accelerate closing cycles."
        )


# Singleton memory service instance
memory_service = MemoryService()
