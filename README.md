# DealMemory: Deal Intelligence Agent with Persistent Memory
> An enterprise sales copilot that remembers every interaction across deal cycles, learns from past won/lost outcomes, and eliminates CRM re-reading using **Hindsight** persistent memory.

[![Hindsight Memory](https://img.shields.io/badge/Memory%20Layer-Vectorize%20Hindsight-8b5cf6?style=for-the-badge&logo=brain)](https://hindsight.vectorize.io/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20Python%203.11-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61dafb?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Groq LLM](https://img.shields.io/badge/Inference-Groq%20openai%2Fgpt--oss--120b-f55036?style=for-the-badge)](https://groq.com/)
[![Band AI](https://img.shields.io/badge/Desktop%20Channel-Band%20AI%20Audio%20Sync-10b981?style=for-the-badge)](https://www.band.ai/)

---

## Table of Contents
1. [The Real Business Problem](#1-the-real-business-problem)
2. [Why Stateless AI Chatbots Fail for Sales](#2-why-stateless-ai-chatbots-fail-for-sales)
3. [The Solution: DealMemory](#3-the-solution-dealmemory)
4. [System Architecture & Deep-Dive Data Flow](#4-system-architecture--deep-dive-data-flow)
5. [How Hindsight Memory Is Used (Retain, Recall, Reflect)](#5-how-hindsight-memory-is-used-retain-recall-reflect)
6. [Core Features & User Stories](#6-core-features--user-stories)
7. [Band AI Desktop Integration](#7-band-ai-desktop-integration)
8. [Data Models & Schema Design](#8-data-models--schema-design)
9. [Side-by-Side Comparison (Memory ON vs OFF)](#9-side-by-side-comparison-memory-on-vs-off)
10. [Local Setup & Quickstart Guide](#10-local-setup--quickstart-guide)
11. [Automated Verification & Acceptance Tests](#11-automated-verification--acceptance-tests)

---

## 1. The Real Business Problem

In B2B enterprise software sales, deal cycles span anywhere from **6 to 18 weeks**, requiring **5 to 15 meetings** involving diverse buying committees (Chief Financial Officers, CISOs, VPs of Operations, Technical Architects).

Across these months of discussions:
* **Critical objections are raised and lost:** e.g., CFO flags budget ceilings, or CISO mandates specific compliance reports.
* **Competitor moves are revealed in passing:** e.g., a rival vendor drops prices by 15% or gets disqualified due to rigid 3-week onboarding SLAs.
* **Commercial promises are made:** e.g., offering a phased pilot, customized ROI models, or delivering architecture audits.

### The Pain Point:
Sales reps spend **3 to 5 hours every week** manually digging through scattered CRM notes, call transcripts, and email threads before every call. Reps frequently walk into calls unaware of previous commitments, repeat questions already answered, and make mistakes that stall pipeline velocity.

---

## 2. Why Stateless AI Chatbots Fail for Sales

Standard LLMs (ChatGPT, Claude, generic assistants) suffer from **conversational amnesia**:
1. **Zero Session Continuity:** Every time a rep opens a new chat, the context resets to zero.
2. **Context Window Flooding:** Dumping 20 raw Zoom transcripts into a prompt exceeds context budgets, slows down inference, hallucinating fake details.
3. **No Cross-Deal Learning:** A generic LLM cannot learn why Deal A was won while Deal B was lost. It cannot tell a rep: *"In past won deals with budget-sensitive CFOs, structuring a Phase 1 pilot closed the contract 85% of the time."*

---

## 3. The Solution: DealMemory

**DealMemory** is an AI deal intelligence workspace that leverages **Hindsight** ([vectorize-io/hindsight](https://github.com/vectorize-io/hindsight)) as its persistent cognitive memory engine.

Instead of forgetting conversations:
* It **retains** every interaction into structured deal facts.
* It **recalls** account-scoped memories to brief reps in under 10 seconds.
* It **reflects** on closed won and lost deals to coach reps on objection-handling playbooks.

---

## 4. System Architecture & Deep-Dive Data Flow

DealMemory is designed as a decoupled, layered microservices architecture:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT WORKSPACE (React 18 + TS + Tailwind)             │
│                                                                                        │
│  ┌───────────────────────┐  ┌────────────────────────────────────────────────────────┐  │
│  │   Active Deals List   │  │   Agent Workspace Tabs:                                │  │
│  │  - Flagship: Apex     │  │   [Pre-Call Brief] [Follow-up] [Coach] [Chat] [Timeline] │
│  │  - CloudScale Tech    │  └────────────────────────────────────────────────────────┘  │
│  │  - FinGuard Bank      │  ┌────────────────────────────────────────────────────────┐  │
│  │  - + Custom Accounts  │  │   Hindsight Live Memory Panel (Real-Time Recalled Facts)│  │
│  └───────────────────────┘  └────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP / JSON REST APIs
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND ORCHESTRATION (FastAPI)                           │
│                                                                                        │
│   ┌──────────────────────────────────┐        ┌───────────────────────────────────┐    │
│   │   Pydantic Structured Extractor  │        │       Agent Reasoning Engine      │    │
│   │   - Objections & Competitors     │        │   - Briefing & Follow-up Copilot  │    │
│   │   - Commitments & Stakeholders   │        │   - Cross-Deal Objection Coach    │    │
│   │   - Dual-Attempt Retry & Fallback│        │   - Compare ON vs OFF Evaluator   │    │
│   └─────────────────┬────────────────┘        └─────────────────┬─────────────────┘    │
└─────────────────────┼───────────────────────────────────────────┼──────────────────────┘
                      │                                           │
         Retain Facts │                                           │ Recall / Reflect
                      ▼                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                       PERSISTENT MEMORY ENGINE (Vectorize Hindsight)                   │
│                                                                                        │
│    Memory Bank: dealmemory-demo                                                        │
│    - TEMPR Multi-Strategy Retrieval (Semantic Vector + BM25 + Graph + Temporal Filters)│
│    - RRF (Reciprocal Rank Fusion) Scoring Engine                                       │
│    - Cross-Encoder Fact Reranker                                                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Complete End-to-End Data Pipeline:
1. **Capture:** Rep inputs meeting notes, email text, or imports a call recording via **Band AI Desktop Sync**.
2. **Fact Extraction:** Groq (`openai/gpt-oss-120b`) parses text into validated JSON entities with strict Pydantic schemas.
3. **Retention (`client.retain`):** Entities and raw text are retained into Hindsight memory bank, tagged with `account_id`, `type`, and `date`.
4. **Contextual Retrieval (`client.recall`):** When generating a brief or draft, Hindsight executes TEMPR fusion to retrieve the top relevant facts.
5. **Grounded Generation:** Groq synthesizes the final brief or email citing exact names, numbers, and dates.
6. **Outcome Reflection (`client.reflect`):** When a deal is marked Won or Lost, Hindsight runs cognitive synthesis across past deals to discover winning tactical patterns.

---

## 5. How Hindsight Memory Is Used (Retain, Recall, Reflect)

DealMemory does not use Hindsight as a generic key-value store. It utilizes all three foundational primitives:

### A. RETAIN (`client.retain`)
Stores unstructured text and transforms it into durable, tagged cognitive facts:
```python
client.retain(
    bank_id="dealmemory-demo",
    content="Apex Logistics CFO Marcus Vance raised concerns that $140k ARR exceeds budget by 18%.",
    document_id="doc_apex_obj_02",
    metadata={"account_id": "acc-apex-logistics", "type": "objection", "date": "2026-01-26"},
    tags=["account:acc-apex-logistics", "type:objection"]
)
```

### B. RECALL (`client.recall`)
Executes four-way TEMPR parallel retrieval (semantic vectors, BM25 keywords, temporal recency, entity relationships):
```python
results = client.recall(
    bank_id="dealmemory-demo",
    query="What budget concerns or competitor mentions did Apex Logistics have?",
    tags=["account:acc-apex-logistics"],
    budget="mid"
)
```
Each recalled memory unit retains its source, timestamp, and relevance score, rendered live in the frontend **Memory Panel**.

### C. REFLECT (`client.reflect`)
Goes beyond vector search to perform cognitive synthesis across memories to uncover tactical correlations:
```python
reflection = client.reflect(
    bank_id="dealmemory-demo",
    query="What objection responses, pricing tactics, and compliance collateral correlate with winning deals?"
)
```
Insights like *"Introducing phased rollout sheets reduces CFO budget friction"* are directly fed into the **Objection Coach**.

---

## 6. Core Features & User Stories

| Feature | User Story | How DealMemory Solves It |
| :--- | :--- | :--- |
| **Pre-Call Brief** | As an AE, I need a 60-second summary before jumping into a prospect call. | Recalls open objections, promises, competitor mentions, and generates actionable talking points. |
| **Follow-up Drafter** | As an AE, I want follow-up emails that reference what the prospect actually said. | Cites exact quotes, promised pricing sheets, and addresses specific stakeholder hesitations. |
| **Objection Coach** | As an AE, I need battle-tested talk tracks when faced with pricing or rival pushback. | Cites real past won deals (e.g. CloudScale Systems) and prescribes proven tactics. |
| **Account Chat** | As a sales manager, I want to ask free-form questions about account status. | Answers grounded strictly in recalled deal memories with zero hallucination. |
| **Custom Deals** | As a user, I want to track my own real-world companies and deals. | **"+ New Account"** modal allows custom accounts, deal values, and contacts. |
| **Compare Mode** | As an evaluator, I want to see the difference between stateless AI and memory. | **Side-by-side modal** contrasts Memory OFF (generic) vs. Memory ON (grounded). |

---

## 7. Band AI Desktop Integration

Per Section 2.3 of the specification:
* **Band AI Desktop** ([band.ai](https://www.band.ai)) provides sales teams with an ambient desktop AI environment.
* DealMemory includes a dedicated **Band AI Audio Sync Modal**:
  1. Reps record audio or dictate meeting notes using Band AI desktop.
  2. The transcript is imported directly into DealMemory via the **"Band AI Sync"** button.
  3. Structured facts are extracted and retained into Hindsight in real time.

---

## 8. Data Models & Schema Design

Relational data is stored in SQLite (`dealmemory.db`) via SQLAlchemy:
* **`accounts`**: `id`, `name`, `industry`, `stage`, `value`, `created_at`
* **`contacts`**: `id`, `account_id`, `name`, `role`, `notes`
* **`interactions`**: `id`, `account_id`, `type`, `date`, `raw_text`, `extracted_json`, `retained`
* **`outcomes`**: `id`, `account_id`, `result` (`won`/`lost`), `reason`, `tactics`, `date`
* **`agent_runs`**: `id`, `account_id`, `kind`, `memory_on`, `recalled_ids`, `output`, `latency_ms`

---

## 9. Side-by-Side Comparison (Memory ON vs OFF)

Clicking the **"Compare ON vs OFF"** button demonstrates the cognitive difference:

```
┌───────────────────────────────────────────────┬───────────────────────────────────────────────┐
│        MEMORY OFF (Stateless Baseline)        │     MEMORY ON (Hindsight Augmented Copilot)   │
├───────────────────────────────────────────────┼───────────────────────────────────────────────┤
│ "Subject: Following up with your team         │ "Subject: Revised phased terms & SOC2 packet  │
│                                               │                                               │
│ Hi team,                                      │ Hi Elena and Marcus,                          │
│ Thanks for taking the time to speak with us.  │ Following up on our sync earlier this week:   │
│ Please let us know if you'd like to schedule  │ 1. To address Marcus's $140k budget ceiling,  │
│ another call to review our platform."         │    we structured Phase 1 at $95k ARR.         │
│                                               │ 2. Attached is our SOC2 Type II audit packet  │
│                                               │    for CISO David Chen.                       │
│                                               │ 3. Unlike FleetTrack Pro's 3-week onboarding, │
│                                               │    our API cutover takes under 48 hours."     │
└───────────────────────────────────────────────┴───────────────────────────────────────────────┘
```

---

## 10. Local Setup & Quickstart Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your credentials:
```env
HINDSIGHT_API_KEY=your_hindsight_api_key
HINDSIGHT_BASE_URL=https://api.hindsight.vectorize.io
HINDSIGHT_BANK_ID=dealmemory-demo

LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
LLM_MODEL=openai/gpt-oss-120b
```

### 2. Start the Backend API
```bash
pip install -r backend/requirements.txt
python backend/run.py
```
Backend runs on `http://127.0.0.1:8000`. Swagger API documentation is available at `http://127.0.0.1:8000/docs`.

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 11. Automated Verification & Acceptance Tests

DealMemory includes an automated test suite verifying all 7 acceptance criteria (**AT-1** to **AT-7**):

```bash
# Verify Hindsight retain, recall, and reflect live
python backend/scripts/test_memory.py

# Run Pytest unit and integration suite
python -m pytest backend/tests -v
```

| Test ID | Requirement | Test Action | Result |
| :--- | :--- | :--- | :--- |
| **AT-1** | FR-4 to FR-7 | Log new call for flagship account | Facts extracted and retained to Hindsight | **PASS** |
| **AT-2** | FR-8, FR-12 | Generate brief with Memory ON | Brief cites CFO budget, rival product, SOC2 | **PASS** |
| **AT-3** | FR-8 | Generate brief with Memory OFF | Stateless generic output with no deal facts | **PASS** |
| **AT-4** | FR-13 | Compare Mode (Side-by-Side) | Both outputs shown with latency metrics | **PASS** |
| **AT-5** | FR-10, FR-17 | Objection coach after 3 closed deals | Advice cites real past won deal evidence | **PASS** |
| **AT-6** | FR-18 | Resilient LLM format handling | Retries and falls back with zero crashes | **PASS** |
| **AT-7** | FR-19 | Offline / Hindsight resilience | Logs warning, continues in resilient mode | **PASS** |

---

## Tech Stack
* **Memory Layer:** [Hindsight Client SDK (Vectorize)](https://github.com/vectorize-io/hindsight)
* **LLM Provider:** [Groq Cloud](https://groq.com/) (`openai/gpt-oss-120b`)
* **Backend:** FastAPI, SQLAlchemy, SQLite, Pydantic v2
* **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
* **Desktop Channel:** Band AI Desktop Integration
