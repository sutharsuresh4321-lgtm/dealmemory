import pytest
from unittest.mock import MagicMock
from app.memory.hindsight_client import MemoryService
from app.memory.schemas import Memory


def test_memory_service_retain_and_recall_mocked():
    service = MemoryService()
    # Mock underlying Hindsight client
    mock_client = MagicMock()
    mock_retain_resp = MagicMock()
    mock_retain_resp.id = "doc-test-123"
    mock_client.retain.return_value = mock_retain_resp

    mock_result_item = MagicMock()
    mock_result_item.id = "mem-1"
    mock_result_item.text = "CFO raised budget concerns"
    mock_result_item.metadata = {"account_id": "acc-1", "date": "2026-03-01", "type": "objection"}
    mock_result_item.tags = ["account:acc-1"]
    mock_result_item.scores = {"combined": 0.95}

    mock_recall_resp = MagicMock()
    mock_recall_resp.results = [mock_result_item]
    mock_client.recall.return_value = mock_recall_resp

    mock_reflect_resp = MagicMock()
    mock_reflect_resp.text = "Early ROI proof resolves budget objections."
    mock_client.reflect.return_value = mock_reflect_resp

    service.client = mock_client
    service.api_key = "test-key"

    # Retain
    doc_id = service.retain(
        bank_id="test-bank",
        content="CFO raised budget concerns",
        metadata={"account_id": "acc-1", "type": "objection"},
    )
    assert doc_id.startswith("doc_") or doc_id == "doc-test-123"
    assert mock_client.retain.called

    # Recall
    memories = service.recall(
        bank_id="test-bank",
        query="budget concerns",
        filters={"account_id": "acc-1"},
    )
    assert len(memories) == 1
    assert memories[0].id == "mem-1"
    assert memories[0].text == "CFO raised budget concerns"
    assert memories[0].relevance == 0.95

    # Reflect
    reflection = service.reflect(bank_id="test-bank", query="budget tactics")
    assert "Early ROI proof" in reflection
