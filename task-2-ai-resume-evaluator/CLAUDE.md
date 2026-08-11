# 🏛️ AI Resume Evaluator — Project Constitution

> **Mission:** Build an intelligent, fair, and transparent resume evaluation system powered by Generative AI that helps candidates improve their applications and helps recruiters make data-driven hiring decisions.

---

## I. Core Tenets

### 1. AI-First, Human-Validated
- AI generates evaluations, scores, and suggestions; humans always have the final say.
- Every AI output must be accompanied by an explanation or confidence indicator.
- No automated rejection without human review.

### 2. Fairness & Bias Mitigation
- The system must actively detect and flag potentially biased language or criteria.
- Evaluation criteria must be transparent and auditable.
- Mask or depersonalize PII (name, gender, age, ethnicity indicators) before analysis where feasible.

### 3. Privacy & Data Stewardship
- Resumes are sensitive documents. Treat them as PII by default.
- Never store raw resume content longer than the evaluation session requires.
- Implement automatic purging of uploaded documents after 30 days.
- All data in transit and at rest must be encrypted.

### 4. Transparency
- Every evaluation score must be traceable to specific resume content and criteria.
- Candidates should receive actionable feedback, not just a score.
- The system must articulate *why* a score was given.

---

## II. Technology Stack & Architecture

### Stack
| Layer | Technology | Rationale |
|---|---|---|
| Language | Python 3.11+ | Requirement spec, LangChain/OpenAI ecosystem |
| Web Framework | Flask | Lightweight, Python-native, requirement spec |
| Frontend | Jinja2 Templates + Bootstrap/Tailwind | Server-side rendering, no separate frontend build |
| Styling | Tailwind CSS (via CDN) + Custom CSS | Consistent, accessible, rapid iteration |
| Design System | Professional Blue (brand/teal accent) | Trustworthy, career-oriented, modern |
| LLM SDK | OpenAI SDK (Python) via OpenCode Zen API | Zero-cost, DeepSeek v4 free model |
| LLM Framework | LangChain | Prompt templates, output parsers, chains |
| PDF Parsing | PyMuPDF (fitz) | Fast, reliable PDF text extraction |
| DOCX Parsing | python-docx | Standard DOCX text extraction |
| Validation | Pydantic | Schema validation for LLM outputs |
| Config | python-dotenv | Environment variable management |
| Deployment | Render / Railway / PythonAnywhere | Python-native hosting, free tiers available |
| Auth | Flask sessions + `authlib` (Google OAuth) + Werkzeug hashing | Email/password + Google sign-in |

### Directory Structure
```
resume-evaluator/
├── app.py                    # Main Flask application entry point
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables (API keys)
├── .gitignore                # Git ignore rules
├── config.py                 # Configuration management
│
├── templates/                # Flask Jinja2 templates
│   ├── base.html            # Base layout with nav, footer
│   ├── index.html           # Landing / home page
│   ├── login.html           # Login page
│   ├── signup.html          # Signup page
│   ├── upload.html          # Resume upload page
│   ├── results.html         # Evaluation results page
│   ├── history.html         # Evaluation history page
│   └── settings.html        # User preferences page
│
├── static/                   # Static assets
│   ├── css/
│   │   └── style.css        # Custom styles + Tailwind
│   ├── js/
│   │   └── main.js          # Client-side interactivity
│   └── images/              # Icons, logos
│
├── src/
│   ├── __init__.py
│   │
│   ├── routes/               # Flask route blueprints
│   │   ├── __init__.py
│   │   ├── auth.py          # Login, signup, logout
│   │   ├── upload.py        # Resume upload & processing
│   │   ├── results.py       # Evaluation results
│   │   └── history.py       # Evaluation history
│   │
│   ├── ai/                   # AI / LangChain integration
│   │   ├── __init__.py
│   │   ├── client.py        # Zen API client (DeepSeek v4)
│   │   ├── prompts.py       # LangChain prompt templates
│   │   ├── chains.py        # LangChain chains
│   │   └── parsers.py       # Pydantic output parsers
│   │
│   ├── resume/               # Resume processing
│   │   ├── __init__.py
│   │   ├── parser.py        # PDF/DOCX text extraction
│   │   ├── pii.py           # PII masking utilities
│   │   └── validator.py     # File validation
│   │
│   ├── models/               # Pydantic data models
│   │   ├── __init__.py
│   │   └── schemas.py       # Evaluation schemas
│   │
│   └── utils/                # Shared utilities
│       ├── __init__.py
│       └── helpers.py        # Misc helpers
│
└── tests/                    # Test suite
    ├── __init__.py
    ├── test_parser.py
    ├── test_ai.py
    └── test_routes.py
```

---

## II.A Deployment Architecture — Flask (Combined Frontend + Backend)

### How Flask Serves Everything as One Project

Unlike modern frontend/backend separation (React + API server), Flask is a **monolithic framework** — it serves both the frontend HTML pages AND the backend API logic from a **single running process**.

```
                    ┌──────────────────────────────────────┐
                    │         USER'S BROWSER                │
                    │  (Chrome, Firefox, etc.)              │
                    └──────────────┬───────────────────────┘
                                  │  HTTP Requests
                                  │  (https://yourapp.onrender.com)
                                  ▼
        ┌─────────────────────────────────────────────────────────┐
        │                    RENDER.COM                            │
        │                                                          │
        │  ┌─────────────────────────────────────────────────────┐ │
        │  │           Gunicorn (WSGI Server)                     │ │
        │  │           ┌─────────────────────────────┐           │ │
        │  │           │   Flask Application Instance  │           │ │
        │  │           │                              │           │ │
        │  │  ┌───────▼──────────────────────────┐   │           │ │
        │  │  │  FRONTEND (Server-Side Rendered)  │   │           │ │
        │  │  │                                  │   │           │ │
        │  │  │  / → templates/index.html        │   │           │ │
        │  │  │  /upload → templates/upload.html  │   │           │ │
        │  │  │  /results → templates/results.html│   │           │ │
        │  │  │  /static/css/style.css            │   │           │ │
        │  │  │  /static/js/main.js               │   │           │ │
        │  │  └──────────┬───────────────────────┘   │           │ │
        │  │             │  (same process)            │           │ │
        │  │  ┌──────────▼───────────────────────┐   │           │ │
        │  │  │  BACKEND (Python Logic)           │   │           │ │
        │  │  │                                  │   │           │ │
        │  │  │  Parse resume (PyMuPDF)          │   │           │ │
        │  │  │  Call DeepSeek (LangChain)        │   │           │ │
        │  │  │  Store results (JSON/SQLite)      │   │           │ │
        │  │  │  Auth (Flask sessions)            │   │           │ │
        │  │  └──────────────────────────────────┘   │           │ │
        │  └─────────────────────────────────────────┘           │ │
        │                                                          │
        │  ┌─────────────────────────────────────────────────────┐ │
        │  │  External API Calls                                  │ │
        │  │  ├── DeepSeek v4 (Zen API) ← LLM evaluation         │ │
        │  │  └── (No other external services in Phase 1)        │ │
        │  └─────────────────────────────────────────────────────┘ │
        └─────────────────────────────────────────────────────────┘
```

### Key Concepts

| Concept | What it means for our project |
|---------|------------------------------|
| **Monolithic** | Frontend + backend = same codebase, same process, same deployment |
| **Flask renders HTML** | Jinja2 templates are processed on the server, sent as finished HTML to browser |
| **No API server needed** | No REST API, no GraphQL, no CORS — Flask handles everything internally |
| **Gunicorn** | Production WSGI server that runs Flask. Handles multiple concurrent requests |
| **Static files** | CSS/JS/images served directly from `static/` folder by Flask |

### Why Combined Architecture is Better for This Project

| Concern | How Flask handles it |
|---------|---------------------|
| **No CORS issues** | Frontend and backend are same origin — no cross-origin problems |
| **Simpler deployment** | One `gunicorn app:app` command starts everything |
| **Faster pages** | HTML is rendered server-side, no client-side JavaScript framework needed |
| **Session management** | Flask sessions work seamlessly — no JWT tokens or auth headers |
| **File uploads** | Direct `request.files` handling, no multipart form quirks |

### Production Startup (Gunicorn)

```bash
# Command Render runs to start the app
gunicorn app:app --bind 0.0.0.0:10000 --workers 4 --timeout 120
```

- `app:app` = Flask instance named `app` inside `app.py`
- `--workers 4` = handles up to 4 requests concurrently
- `--timeout 120` = 2-minute timeout for long AI evaluations (far beyond Vercel's 10s)

---

## II.B Design System — Professional Blue Palette

### Color Palette
```css
/* Tailwind-style custom properties */
:root {
  --brand-50: #eff6ff;
  --brand-100: #dbeafe;
  --brand-200: #bfdbfe;
  --brand-300: #93c5fd;
  --brand-400: #60a5fa;
  --brand-500: #3b82f6;   /* PRIMARY — buttons, links, main actions */
  --brand-600: #2563eb;   /* primary hover */
  --brand-700: #1d4ed8;   /* active state */
  --brand-800: #1e3a5f;   /* dark backgrounds */
  --brand-900: #172554;   /* darkest — text on light bg */
  
  --accent-50: #f0fdfa;
  --accent-100: #ccfbf1;
  --accent-200: #99f6e4;
  --accent-300: #5eead4;
  --accent-400: #2dd4bf;
  --accent-500: #14b8a6;  /* ACCENT — success states, highlights */
  --accent-600: #0d9488;  /* accent hover */
  --accent-700: #0f766e;
  --accent-800: #115e59;
  --accent-900: #134e4a;
}
```

### Color Usage Rules
| Element | Color | Why |
|---------|-------|-----|
| Primary buttons, nav | `brand-500` / `brand-600` | Action focus |
| Links | `brand-600` | Recognizable interaction |
| Success states, score high | `accent-500` | Positive feedback |
| Score medium | `amber-500` (Tailwind built-in) | Warning/caution |
| Score low | `red-500` (Tailwind built-in) | Needs attention |
| Backgrounds (light) | `brand-50` or white | Clean, airy |
| Backgrounds (dark) | `brand-900` | Professional dark mode |
| Text body | `gray-700` / `gray-300` (dark) | Readability |

### Score Color Scale
```
0-40  → red-500      (critical gaps)
41-60 → amber-500    (needs work)
61-80 → accent-400   (good)
81-100→ accent-500   (excellent)
```

### Dark Mode Strategy
- CSS class toggle on `<body>`: `dark-mode`
- Uses CSS custom properties for seamless switching
- User preference stored in localStorage + session

---

## III. Coding Standards & Patterns

### General
- **Python 3.11+** — type hints required for all functions
- **Flask blueprints** — modular route organization
- **Pydantic** — all data models validated at boundaries
- **Jinja2 templates** — server-side rendering, minimal JS
- **No class-based views** — use Flask function views with decorators

### LangChain Integration Patterns

```python
# src/ai/client.py
import os
from openai import OpenAI

ZEN_BASE_URL = "https://opencode.ai/zen/v1"
ZEN_MODEL = "deepseek-v4-flash-free"

client = OpenAI(
    api_key=os.getenv("ZEN_API_KEY", ""),
    base_url=ZEN_BASE_URL,
)

def get_model() -> str:
    return ZEN_MODEL
```

```python
# src/ai/prompts.py
from langchain.prompts import ChatPromptTemplate

EVALUATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert resume reviewer with 15 years of experience in tech hiring.
Evaluate this resume across 6 categories with scores 0-100.

FAIRNESS INSTRUCTION:
- Do NOT penalize candidates for employment gaps, non-traditional education, non-English names, or protected characteristics.
- If evaluation criteria itself seems biased, flag it in biasWarnings.
- Focus on skills, achievements, and relevance — not pedigree.

Return structured JSON matching the schema provided."""),
    ("user", "Resume:\n{resume_text}\n\nTarget Role: {target_role}"),
])
```

```python
# src/ai/chains.py
from langchain.chains import LLMChain
from langchain_openai import ChatOpenAI
from src.ai.client import get_model, ZEN_BASE_URL

def create_evaluation_chain() -> LLMChain:
    llm = ChatOpenAI(
        model=get_model(),
        base_url=ZEN_BASE_URL,
        temperature=0.3,
        model_kwargs={"response_format": {"type": "json_object"}},
    )
    return LLMChain(
        llm=llm,
        prompt=EVALUATION_PROMPT,
        output_parser=EvaluationParser(),
    )
```

### Structured Output with Pydantic

```python
# src/models/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional

class Category(BaseModel):
    name: str
    score: int = Field(ge=0, le=100)
    reasoning: str = Field(min_length=10)
    suggestions: List[str] = Field(min_length=1)

class Evaluation(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    categories: List[Category] = Field(min_length=1)
    summary: Optional[str] = None
    strengths: Optional[List[str]] = None
    improvements: Optional[List[dict]] = None
    bias_warnings: Optional[List[str]] = None
    ats_compatibility: Optional[dict] = None
```

### Error Handling
- Every route must wrap in try/except and return structured errors.
- User-facing errors must be human-readable; internal logs capture technical detail.
- Centralized error handler with Flask `@app.errorhandler` decorators.

```python
# src/utils/helpers.py
from flask import jsonify

class AppError(Exception):
    def __init__(self, message: str, code: str, status_code: int = 400, actionable: bool = False):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.actionable = actionable
        super().__init__(message)

def register_error_handlers(app):
    @app.errorhandler(AppError)
    def handle_app_error(error):
        return jsonify({
            "error": error.message,
            "code": error.code,
            "actionable": error.actionable,
        }), error.status_code

    @app.errorhandler(500)
    def handle_internal_error(error):
        return jsonify({
            "error": "An unexpected error occurred.",
            "code": "INTERNAL_ERROR",
            "actionable": False,
        }), 500
```

---

## IV. AI Prompt Constitution

Every prompt sent to an LLM must adhere to these rules:

1. **Role & Context** — Begin every prompt by defining the AI's role clearly.
   ```
   You are an expert resume reviewer with 15 years of experience in tech hiring.
   ```

2. **Structural Output** — Always request structured output (JSON) with a Pydantic schema for validation.

3. **Fairness Clause** — Include: *"If you detect any potential bias in the resume criteria, flag it separately. Do not penalize candidates for protected characteristics."*

4. **Actionable Feedback** — Every criticism must be paired with a suggestion for improvement.

5. **Scoring Rubric** — Include an explicit rubric so scores are reproducible and explainable.

6. **Temperature Control** — Use `temperature: 0.3` for evaluation consistency; `temperature: 0.7` for suggestion generation.

---

## V. Security & Compliance

- **Authentication**: Flask session-based auth + Google OAuth via `authlib`.
- **Authorization**: Users can only access their own evaluations.
- **Rate Limiting**: Flask-Limiter on `/evaluate` endpoint to prevent abuse.
- **File Upload**: Limit to `.pdf`, `.docx`, `.txt`; max 5 MB; validate MIME type server-side.
- **Uploaded File Retention**: Keep uploaded resume files for **30 days** (same as evaluation TTL). Auto-delete after.
- **Prompt Injection**: Sanitize resume content before inserting into prompts. Never trust raw user input in system prompts.
- **Audit Trail**: Log every evaluation request with user ID, timestamp, and file hash.
- **Anonymous Evaluation**: Optional checkbox on upload page: *"Enable anonymous evaluation (mask my name)"*. When checked, candidate name is masked before LLM analysis.
- **Slow Evaluation (>15s)**: Show message *"This is taking longer than usual. You can wait or [try again]"* with a retry button.
- **Free Tier Limit**: When user hits 10 evaluations/day, show message + upsell to paid Pro tier.
- **Cold Start**: Render free tier sleeps after 15min. Show *"Waking up the app..."* loading spinner. Phase 2: add cron-job.org pinger to prevent sleep.

---

## VI. Testing & Quality Gates

| Gate | Tool | When |
|---|---|---|
| Type checking | mypy | Every commit |
| Linting | flake8 + black | Every commit |
| Unit tests | pytest | Every PR |
| AI output validation | Pydantic schema + integration test | Prompt changes |
| Accessibility | Manual check + axe-core | Every PR |

### Testing AI Outputs
```python
# tests/test_ai.py
def test_evaluation_schema():
    result = evaluate_resume("John Doe\nSoftware Engineer\nPython, React")
    assert 0 <= result.overall_score <= 100
    assert len(result.categories) >= 1

def test_empty_resume():
    result = evaluate_resume("")
    assert result.overall_score == 0
    assert len(result.categories) == 0
```

---

## VII. Commit & Workflow Conventions

### Commit Format
```
<type>: <short description>

- Bullet points for details
- Reference issue numbers
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `security`

### Branch Naming
- `feat/<name>` — new features
- `fix/<name>` — bug fixes
- `refactor/<name>` — refactoring
- `docs/<name>` — documentation

---

## VIII. Performance Budgets

| Metric | Target | Threshold |
|---|---|---|
| Initial evaluation latency | < 5s | < 10s |
| Page load | < 2s | < 3s |
| PDF extraction | < 3s | < 5s |

---

## IX. Environmental Variables

```env
# Flask
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-here

# AI Provider (DeepSeek v4 via OpenCode Zen API)
ZEN_API_KEY=
ZEN_BASE_URL=https://opencode.ai/zen/v1
ZEN_MODEL=deepseek-v4-flash-free

# App Config
MAX_FILE_SIZE_MB=5
EVALUATION_TTL_DAYS=30

# Deployment
RENDER_URL=  # If deploying on Render
```

---

## X. Decision Records

When significant architectural decisions are made, document them in `docs/decisions/` with the format:

```
# ADR-001: Python + Flask over Next.js

**Date:** 2026-07-14

**Context:** Project requirements specify Python, Flask, and LangChain...

**Decision:** Python 3.11+ with Flask framework and LangChain for LLM integration.

**Rationale:** Matches project requirements exactly. Python ecosystem has best support for LangChain and document parsing.

**Consequences:** Need Python-native hosting (Render/Railway) instead of Vercel.
```

---

*This constitution is a living document. Update it as the project evolves, but changes must be justified and agreed upon by the team.*
