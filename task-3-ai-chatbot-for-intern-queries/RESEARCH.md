# Research — Chatbot for Intern Queries

> Compiled from 5 parallel research agents.  
> Date: 2026-07-25  
> Project: Internee.pk GenAI Intern Query Chatbot

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Rasa vs Dialogflow — NLU Framework Choice](#2-rasa-vs-dialogflow--nlu-framework-choice)
3. [OpenCode Free API Integration](#3-opencode-free-api-integration)
4. [Urdu-English NLU & Code-Switching](#4-urdu-english-nlu--code-switching)
5. [Flask Backend Architecture](#5-flask-backend-architecture)
6. [Knowledge Base & RAG Strategy](#6-knowledge-base--rag-strategy)
7. [Recommended Architecture](#7-recommended-architecture)

---

## 1. Executive Summary

| Decision | Winner | Why |
|---|---|---|
| **NLU Framework** | **Rasa Open Source** | Only viable option for Urdu/English code-switching; $5-15/mo vs $150+/mo for Dialogflow |
| **LLM Provider** | **OpenCode API** | OpenAI-compatible; free tier available for prototyping; production path via BYOK |
| **Backend** | **Flask + Celery + Redis** | Simple, scalable, handles WhatsApp webhooks within 5s ACK timeout |
| **Knowledge Base** | **Hybrid (pgvector + FTS)** | Start with JSON + in-memory FAISS; scale to pgvector on Supabase |
| **Language Handling** | **Preprocessor + LLM** | Custom Roman Urdu normalizer + LLM handles code-switching natively |

---

## 2. Rasa vs Dialogflow — NLU Framework Choice

### Verdict: Rasa Open Source wins decisively

**Why not Dialogflow?**
- Urdu is NOT a supported language in Dialogflow. You cannot train it on Urdu utterances.
- Code-switched Urdu-English text is treated as garbage or forced into English-only training.
- Dialogflow ES at ~75K queries/month = **$150+/month**. Dialogflow CX = **$1,125+/month**.
- For a budget-constrained 24/7 chatbot, this is prohibitive.

**Why Rasa:**
- **Language-agnostic** — train on Roman Urdu, Urdu script, English, all mixed.
- **DIET classifier** handles intents + entities jointly, works with multilingual BERT.
- **Custom actions** call Internee.pk APIs, vector DBs, or any REST endpoint.
- **Free** (self-hosted). Only pay for server ($5-15/month on Railway/Render).
- **Fallback intent** (`nlu_fallback`) triggers LLM path when confidence is low.

### Cost Comparison (75K queries/month)

| Cost Component | Rasa | Dialogflow ES | Dialogflow CX |
|---|---|---|---|
| NLU platform | **$0** (open source) | ~$150 | ~$1,125 |
| Server hosting | **$5-15/mo** | + fulfillment server | + fulfillment server |
| WhatsApp fees | Same (Twilio/360dialog) | Same | Same |
| **Annual total** | **~$60-180** | **~$1,800+** | **~$13,500+** |

---

## 3. OpenCode Free API Integration

### API Compatibility

OpenCode Zen provides OpenAI-compatible endpoints. For free models:
- **Endpoint:** `https://opencode.ai/zen/v1/chat/completions`
- **Auth:** `Authorization: Bearer YOUR_OPENCODE_WORKSPACE_KEY`
- **SDK:** Use OpenAI Python SDK with custom `base_url`

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://opencode.ai/zen/v1",
    api_key="YOUR_OPENCODE_WORKSPACE_KEY"
)

response = client.chat.completions.create(
    model="deepseek-v4-flash-free",
    messages=[
        {"role": "system", "content": "You are a helpful assistant for Internee.pk interns."},
        {"role": "user", "content": "mujhe task samajh nahi aya"}
    ],
    temperature=0.3
)
```

### Key Findings

| Aspect | Details |
|---|---|
| **Free models** | DeepSeek V4 Flash Free, Big Pickle, MiMo-V2.5, Laguna S 2.1, etc. |
| **Limitations** | Beta stage — no SLA, may change/break, free models may use data for training |
| **Latency** | Proxy overhead adds 100-300ms vs direct API call |
| **Production path** | Use for dev/prototyping; plan to migrate to direct OpenAI/Anthropic or use BYOK |
| **Streaming** | Supported ✅ |
| **Function calling** | Depends on underlying model — test before relying on it |

### Recommendation
Use OpenCode free API for development and MVP. For production 24/7:
- Option A: BYOK (Bring Your Own Key) through OpenCode's dashboard
- Option B: Direct OpenAI/Anthropic API calls from Flask backend

---

## 4. Urdu-English NLU & Code-Switching

### Understanding Roman Urdu

Roman Urdu (Urdu written in Latin script) is the dominant written form among Pakistani youth. Key challenges:

| Challenge | Example | Impact |
|---|---|---|
| **Spelling inconsistency** | "chahiye" / "chaheye" / "chaiye" / "chahye" | Same word, 20+ variants |
| **No standard tokenization** | "taskmein" vs "task mein" | Whitespace splitting fails |
| **Code-switching** | "mujhe task complete karna hai" | Urdu grammar + English content words |
| **Tech terms always English** | "branch", "commit", "deploy", "PR", "bug" | Domain vocabulary is fixed |

### Query Patterns in Pakistani Tech Interns

| Pattern | Example |
|---|---|
| Urdu frame + English nouns | "mujhe yeh task complete karna hai" |
| English + Urdu discourse markers | "Just push your branch, theek hai? warna deadline miss ho jayega" |
| Technical terms in English | "kal wali meeting ka minutes kahan milein ge?" |
| Single-word Urdu insertions | "The deadline is tomorrow but I need kuch extra time" |

### Recommended NLU Pipeline

```
User Query
    ↓
[1] Preprocessor (Python)
    ↓
[2] Rasa Intent Classifier
    ↓
    ├── Confidence ≥ 0.85 → Direct intent response
    └── Confidence < 0.85 → OpenCode LLM fallback
                               ↓
                         [3] Knowledge Base Retrieval
                               ↓
                         [4] LLM generates answer with KB context
                               ↓
                         [5] Fallback chain:
                              LLM fails → Ask in English → Human handoff
```

### Preprocessor Design

Build a lightweight Python module (~200 lines) with:
1. **Normalization dictionary** (~500 entries mapping spelling variants to canonical forms)
2. **Character-level normalization** (vowel harmonization)
3. **Attached-form splitting** ("taskmein" → "task mein")
4. **Token-level language detection** (English vs Roman Urdu)

### Intent Taxonomy (Recommended)

| Intent Group | Intents |
|---|---|
| **greeting** | greet, ask_identity, farewell |
| **task_query** | ask_task_help, ask_task_submission, ask_task_deadline, ask_task_extension, report_task_complete |
| **technical_support** | report_login_issue, report_portal_down, report_error, ask_credentials |
| **hr_policy** | ask_stipend, ask_leave, ask_policy, ask_certificate, ask_timings |
| **feedback_report** | feedback, complaint, ask_mentor |
| **out_of_scope** | nlu_fallback → LLM → human |

---

## 5. Flask Backend Architecture

### Project Structure

```
intern-chatbot/
├── run.py                     # Entry point
├── config.py                  # Config classes
├── wsgi.py                    # Production entry (Gunicorn)
├── requirements.txt
├── app/
│   ├── __init__.py            # Flask app factory
│   ├── api/                   # Route blueprints
│   │   ├── chat.py            # POST /api/chat, SSE streaming
│   │   ├── webhooks.py        # POST /api/webhooks/whatsapp, /telegram
│   │   ├── sessions.py        # Session management
│   │   ├── health.py          # GET /api/health
│   │   └── analytics.py       # GET /api/analytics/summary
│   ├── core/                  # Business logic
│   │   ├── llm_client.py      # OpenCode API wrapper
│   │   ├── rag_engine.py      # Retrieve → augment → generate
│   │   ├── knowledge_base.py  # KB retrieval (tiered)
│   │   ├── embedding_service.py
│   │   ├── session_manager.py
│   │   ├── rate_limiter.py    # Redis sliding-window
│   │   └── language_detector.py
│   ├── integrations/          # Platform adapters
│   │   ├── whatsapp.py        # WhatsApp Business API
│   │   ├── telegram.py        # Telegram Bot API
│   │   └── widget.py          # Web widget (SSE)
│   ├── tasks/                 # Celery async tasks
│   │   └── answer_tasks.py
│   ├── services/              # Orchestration + logging
│   └── utils/
├── tests/
└── knowledge-base/            # KB documents (JSON/MD)
```

### API Endpoints

| Method | Path | Purpose | Rate Limit |
|---|---|---|---|
| POST | `/api/chat` | Web widget — send message | 30/min per IP |
| GET | `/api/chat/stream/<session_id>` | SSE stream for typing indicator | 1/session |
| POST | `/api/webhooks/whatsapp` | WhatsApp incoming | Per WhatsApp |
| POST | `/api/webhooks/telegram` | Telegram webhook | Per Telegram |
| GET | `/api/sessions/<id>` | Get chat history | 60/min |
| GET | `/api/analytics/summary` | Aggregated stats | 5/min |
| GET | `/api/health` | Readiness check | No limit |

### Async Architecture (Celery)

**Why Celery over Flask async:**
- WhatsApp requires ACK within 5 seconds — Celery ACKs fast, processes async.
- Worker crash recovery — re-delivers unacked tasks.
- Dedicated worker pool doesn't block REST endpoints.

```
Nginx → Gunicorn → Flask (REST)
                     ↓
               Celery worker → OpenCode API → WhatsApp/Telegram
                     ↓
               Redis (broker + rate limiter + SSE pub/sub)
                     ↓
               Supabase (PostgreSQL + pgvector)
```

---

## 6. Knowledge Base & RAG Strategy

### Three-Tier Retrieval

```
                    ┌─────────────────────────┐
                    │  Tier 1: Exact Match     │ ← FAQ keyword lookup
                    │  (O(1), instant, free)   │
                    └─────────┬───────────────┘
                              │ fall through
                    ┌─────────v───────────────┐
                    │  Tier 2: Full-Text Search│ ← pg_trgm + tsvector
                    │  (PostgreSQL, fuzzy)     │
                    └─────────┬───────────────┘
                              │ fall through
                    ┌─────────v───────────────┐
                    │  Tier 3: Vector Search   │ ← pgvector, cosine sim
                    │  (multilingual-e5-small) │
                    └─────────┬───────────────┘
                              │
                    ┌─────────v───────────────┐
                    │  LLM + Context           │ ← OpenCode API generates
                    │  (all retrieved chunks)  │    answer with citations
                    └─────────────────────────┘
```

### Recommended Starting Point (MVP Phase)

| Component | Choice | Rationale |
|---|---|---|
| **Storage** | JSON files loaded in memory | Zero infra, ~50 lines of code |
| **Embeddings** | `intfloat/multilingual-e5-small` | Free, 384 dims, CPU-friendly, supports Urdu/English |
| **Vector index** | In-memory FAISS | No separate DB needed for MVP |
| **Cache** | In-memory dict (exact match) + semantic cache | Cuts LLM calls by 30-50% |
| **Chunking** | Section-aware recursive split (512 tokens, 50 overlap) | Preserves guidelines structure |

### Phase 2 (Scale) — Migrate to Supabase + pgvector

```sql
CREATE EXTENSION vector;

CREATE TABLE knowledge_documents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    category    TEXT NOT NULL,
    content     TEXT NOT NULL,
    content_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED,
    embedding   VECTOR(384),
    tags        TEXT[],
    locale      TEXT DEFAULT 'both',
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_tsv ON knowledge_documents USING GIN(content_tsv);
CREATE INDEX idx_knowledge_embedding ON knowledge_documents
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## 7. Recommended Architecture

### Full System Diagram

```
                    ┌────────────────────────────────────────────┐
                    │            User Channels                   │
                    │  Web Widget  │  Telegram  │  WhatsApp      │
                    └──────┬───────┴─────┬──────┴───────┬───────┘
                           │             │              │
                    ┌──────v─────────────v──────────────v───────┐
                    │           Flask Backend (Gunicorn)         │
                    │                                           │
                    │  POST /api/chat   POST /api/webhooks/*     │
                    │                                           │
                    │  ┌─────────┐   ┌─────────────────────┐   │
                    │  │ Rate    │   │ Preprocessor         │   │
                    │  │ Limiter │   │ (normalize, tokenize) │   │
                    │  └─────────┘   └──────────┬──────────┘   │
                    │                           │              │
                    │              ┌────────────v───────────┐  │
                    │              │  Rasa NLU (Docker)      │  │
                    │              │  Intent Classification  │  │
                    │              │  Entity Extraction      │  │
                    │              └────────────┬───────────┘  │
                    │                     ≥0.85 │   <0.85      │
                    │                  ┌───────v───────┐       │
                    │                  │  Direct Reply │       │
                    │                  └───────┬───────┘       │
                    │                          │              │
                    │              ┌────────────v───────────┐  │
                    │              │  OpenCode LLM (Fallback)│  │
                    │              │  + KB Context           │  │
                    │              └────────────────────────┘  │
                    │                           │              │
                    └───────────────────────────┼──────────────┘
                                                │
                    ┌───────────────────────────v──────────────┐
                    │            Celery Workers (Async)         │
                    │  ┌─────────────┐  ┌──────────────────┐   │
                    │  │ KB Retrieval│  │ Outbound Messages│   │
                    │  │ (3-tier)    │  │ (WhatsApp, TG)   │   │
                    │  └─────────────┘  └──────────────────┘   │
                    └──────────────────────────────────────────┘
                                                │
                    ┌───────────────────────────v──────────────┐
                    │            Infrastructure                │
                    │                                          │
                    │  ┌──────────┐  ┌────────┐  ┌─────────┐ │
                    │  │ Supabase │  │ Redis  │  │ OpenCode│ │
                    │  │ (DB + KB)│  │(Cache, │  │  API    │ │
                    │  │ pgvector │  │ Broker)│  │ (LLM)   │ │
                    │  └──────────┘  └────────┘  └─────────┘ │
                    │                                          │
                    │  Rasa Docker (optional, if used)         │
                    └──────────────────────────────────────────┘
```

### Tech Stack Summary

| Layer | Technology | Cost |
|---|---|---|
| **Backend** | Flask + Gunicorn | Free |
| **Async** | Celery + Redis | Free (Redis on Railway) |
| **NLU** | Rasa Open Source | Free (self-hosted) |
| **LLM** | OpenCode API (free) → BYOK/production later | Free → ~$5-20/mo |
| **Database** | Supabase (PostgreSQL + pgvector) | Free tier |
| **Embeddings** | `intfloat/multilingual-e5-small` | Free (CPU) |
| **Frontend** | Web widget (SSE) | Free |
| **Messaging** | WhatsApp Business API + Telegram Bot API | Usage-based |
| **Deployment** | Railway / Render | ~$5-15/mo |

### Development Phases

**Phase 1 — MVP (1-2 weeks)**
- [ ] Flask backend with basic API endpoints
- [ ] OpenCode API integration with system prompt
- [ ] Preprocessor for Roman Urdu normalization
- [ ] Knowledge base as JSON files → in-memory FAISS
- [ ] Web widget (basic chat UI)
- [ ] Telegram bot integration
- [ ] 4-tier fallback chain

**Phase 2 — Scale (Month 2-3)**
- [ ] Rasa NLU integration (train on real query data)
- [ ] Supabase + pgvector for knowledge base
- [ ] Semantic + exact query caching (Redis)
- [ ] WhatsApp Business API integration
- [ ] Analytics dashboard

**Phase 3 — Polish (Month 3+)**
- [ ] User feedback loop ("Was this helpful?")
- [ ] Query re-writing for typos/spelling normalization
- [ ] Cross-encoder re-ranking for KB retrieval
- [ ] Pre-computed hot answers for top-50 queries
- [ ] A/B testing for NLU pipelines

### Cost-Estimate (Monthly)

| Item | MVP Phase | Production Scale |
|---|---|---|
| Server (Railway/Render) | $5-10 | $10-20 |
| OpenCode API | Free | $0-5 (or BYOK) |
| Supabase | Free | $10-25 |
| Redis | Included | $5-10 |
| WhatsApp API | ~$5-20 | ~$20-50 |
| **Total** | **~$10-30/mo** | **~$35-105/mo** |

---

*End of research document. All recommendations are based on the project constraints: Flask, Rasa/Dialogflow, OpenCode API, 24/7 operation, English+Urdu support, and Internee.pk knowledge base integration.*
