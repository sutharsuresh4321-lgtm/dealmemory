# DealMemory: Deal Intelligence Agent with Persistent Memory

DealMemory is an enterprise sales intelligence copilot that uses **Hindsight** ([vectorize-io/hindsight](https://github.com/vectorize-io/hindsight)) as its persistent long-term memory engine. 

While generic AI assistants suffer from conversational amnesia—forgetting past objections, pricing terms, and commitments between meetings—DealMemory retains every interaction as a structured, durable memory bank. When reps need a pre-call brief, follow-up email, or objection coaching, DealMemory recalls and reflects on past interactions to deliver answers grounded in historical deal reality.

---

## Key Capabilities

- **Pre-Call Executive Brief (FR-8)**: Recalls all previous discussions, open objections, decision-makers, and competitor mentions to generate a 60-second meeting dossier.
- **Fact-Grounded Follow-up Drafter (FR-9)**: Drafts executive emails referencing specific promises made (e.g. customized ROI models, phased pricing tiers, security questionnaires).
- **Cross-Deal Objection Coach (FR-10, FR-17)**: Recalls historical win/loss outcomes across accounts and synthesizes tactical advice citing past deals.
- **Account Copilot Chat (FR-11)**: Free-form conversational assistant grounded in account-scoped memory.
- **Side-by-Side Memory Comparator (FR-13)**: Prominent **Memory ON/OFF** toggle and side-by-side modal showing the contrast between stateless LLM outputs and memory-augmented intelligence.
- **Hindsight Reflection Loop (FR-16)**: Win/loss outcomes are retained and reflected into higher-level insights on what tactics correlate with closing deals.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |         DealMemory Frontend           |
                      |    (React 18 + TypeScript + Tailwind) |
                      +-------------------+-------------------+
                                          |
                                          v  REST API
                      +---------------------------------------+
                      |          FastAPI Backend              |
                      |  - SQLite (Accounts, Deals, Timelines)|
                      |  - Pydantic Schema Fact Extraction   |
                      +---------+-------------------+---------+
                                |                   |
                 Retain / Recall|                   | LLM Inference
                 Reflect        v                   v
        +-------------------------------+   +-------------------+
        |       Hindsight SDK           |   |       Groq        |
        |  (vectorize-io/hindsight)     |   | openai/gpt-oss-   |
        |  - TEMPR Fusion Search        |   | 120b              |
        |  - Bank: dealmemory-demo      |   +-------------------+
        +-------------------------------+
```

For full architectural diagrams and data flows, see [docs/architecture.md](docs/architecture.md).

---

## How Hindsight Memory Is Used

DealMemory utilizes Hindsight as a first-class cognitive memory layer using three core primitives:

### 1. Retain (`client.retain`)
When an Account Executive logs notes, call transcripts, or emails:
- The backend parses the interaction into discrete factual units: `objections`, `competitors`, `stakeholders`, `commitments`, and `pricing`.
- Raw text and structured units are retained into the Hindsight memory bank (`dealmemory-demo`), tagged with `account_id`, `type`, and `date`.
- Document IDs and metadata enable delta updates and auditability.

```python
client.retain(
    bank_id="dealmemory-demo",
    content="Apex Logistics CFO Marcus Vance raised concerns that $140k ARR exceeds budget by 18%.",
    document_id="doc_apex_obj_02",
    metadata={"account_id": "acc-apex-logistics", "type": "objection", "date": "2026-01-26"},
    tags=["account:acc-apex-logistics", "type:objection"]
)
```

### 2. Recall (`client.recall`)
Before generating a brief, drafting an email, or answering questions:
- DealMemory queries Hindsight using **TEMPR multi-vector retrieval** (semantic embeddings, BM25 keyword matching, entity graph links, and temporal recency filters).
- Recalled memories are returned to the frontend **Memory Panel** with relevance scores, source tags, and timestamps so reps see what the agent remembered.

```python
results = client.recall(
    bank_id="dealmemory-demo",
    query="What budget concerns or competitor mentions did Apex Logistics have?",
    tags=["account:acc-apex-logistics"],
    budget="mid"
)
```

### 3. Reflect (`client.reflect`)
When deals are marked as **Closed Won** or **Closed Lost**:
- The outcome and tactics are retained into Hindsight.
- A reflection query triggers Hindsight's cognitive synthesis over all past deal memories to produce cross-account insights:
  
```python
insights = client.reflect(
    bank_id="dealmemory-demo",
    query="What objection responses, pricing tactics, and compliance collateral correlate with winning deals?"
)
```
These synthesized insights are then directly injected into the **Objection Coach** to cite real winning playbooks.

---

## Band AI Desktop Integration

Per Section 2.3 of the specification:
- **Band AI Desktop** ([band.ai](https://www.band.ai)) provides sales reps with an intelligent desktop environment.
- DealMemory is configured to serve as an agentic memory provider for desktop sessions:
  1. Reps running Band AI desktop can paste meeting audio transcripts into DealMemory.
  2. The extracted action items and commitments are preserved in Hindsight, allowing Band AI agent workflows to query the `/api/agent/brief` and `/api/agent/followup` endpoints.
  3. The local API server runs on `http://127.0.0.1:8000` with open CORS for desktop client access.

---

## Setup & Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- (Optional) Docker & Docker Compose

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your configuration keys:
```env
HINDSIGHT_API_KEY=----
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
HINDSIGHT_BANK_ID=dealmemory-demo

LLM_PROVIDER=groq
GROQ_API_KEY=----
LLM_MODEL=openai/gpt-oss-120b
```
*(Note: If `HINDSIGHT_API_KEY` or `GROQ_API_KEY` are omitted, DealMemory runs with automatic offline mock & heuristic fallback to ensure 100% demo resilience per FR-19).*

---

### 2. Running Backend (FastAPI)
```bash
# In project root
pip install -r backend/requirements.txt
python backend/run.py
```
The backend starts at `http://127.0.0.1:8000`. Database tables and realistic seed data are initialized automatically.

---

### 3. Running Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

### 4. Running with Docker Compose
```bash
docker compose up --build
```

---

## Acceptance Test Suite (AT-1 to AT-7)

| Test ID | Test Description | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| **AT-1** | Log a new call for the flagship account | Structured facts extracted, retained to Hindsight, displayed in Memory Panel | **PASS** |
| **AT-2** | Generate brief with Memory ON | Brief explicitly cites at least 3 past facts (CFO Marcus budget, FleetTrack Pro, SOC2) | **PASS** |
| **AT-3** | Generate brief with Memory OFF | Stateless generic output with no account-specific facts | **PASS** |
| **AT-4** | Compare Mode (Side-by-Side) | Both outputs shown side by side in modal with distinct outputs and latencies | **PASS** |
| **AT-5** | Objection coach after 3 closed deals | Advice cites real past deal evidence (e.g. CloudScale Systems won deal) | **PASS** |
| **AT-6** | Resilient LLM format handling | Retries schema extraction and falls back gracefully with zero crashes (FR-18) | **PASS** |
| **AT-7** | Hindsight connectivity resilience | Clear warning logged; gracefully degrades to memory-OFF / offline mode (FR-19) | **PASS** |

To execute the automated test suite:
```bash
python -m pytest backend/tests -v
```
To run the Hindsight memory verification script:
```bash
python backend/scripts/test_memory.py
```
