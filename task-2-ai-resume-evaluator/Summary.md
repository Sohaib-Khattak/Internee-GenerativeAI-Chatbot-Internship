# 📋 AI Resume Evaluator — Project Summary

> **Generated:** 2026-07-15 | **Purpose:** Compact session summary for context restoration

---

## 🎯 Project Mission

Build an intelligent, fair, and transparent resume evaluation system powered by Generative AI that helps candidates improve their applications and helps recruiters make data-driven hiring decisions.

**Deliverable:** A web tool to provide AI-driven resume feedback.
**Stack:** Python, OpenAI API (via DeepSeek v4 free model), LangChain, Flask.

---

## 🏗️ Tech Stack

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
| Auth | Flask sessions + `authlib` (Google OAuth) + Werkzeug hashing | Email/password + Google sign-in |
| Deployment | Render / Railway / PythonAnywhere | Python-native hosting, free tiers available |
| Production Server | Gunicorn | `gunicorn app:app --bind 0.0.0.0:10000 --workers 4 --timeout 120` |

---

## 📁 Directory Structure

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

## 🎨 Design System — Professional Blue

### Color Palette
```css
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

### Score Color Scale
- 0-40 → `red-500` (critical gaps)
- 41-60 → `amber-500` (needs work)
- 61-80 → `accent-400` (good)
- 81-100 → `accent-500` (excellent)

---

## ⚙️ Key Architectural Decisions (CLARIFY Phase — 10 Decisions)

### Q1: Free Tier Limit — What happens at 10 evals/day?
- **Answer:** Show message + upsell to paid "Pro" tier

### Q2: Slow Evaluation (>15s) — What happens?
- **Answer (CRITICAL CORRECTION):** Simple synchronous approach — show loading spinner, disable "Evaluate" button, show message: *"This is taking longer than usual. You can wait or [try again]"* with retry button. (Original choice was Option C — partial results — but changed after tradeoff discussion about Flask's synchronous nature.)

### Q3: Cold Start (Render free tier — sleeps after 15min)
- **Answer:** Simple load-first — show loading spinner *"Waking up the app..."*, let request complete. Phase 2: add cron-job.org pinger.

### Q4: File Retention Period
- **Answer:** 30 days (auto-delete both uploaded resumes and stored evaluations)

### Q5: Authentication Methods
- **Answer:** Email/password (Werkzeug hashing) + Google OAuth via `authlib`

### Q6: Anonymous Evaluation
- **Answer:** Optional checkbox on upload — *"Enable anonymous evaluation (mask my name)"* — masks candidate name before LLM analysis

### Q7: Export Results Format
- **Answer:** Option C — Export as PDF with checkboxes for tracked feedback items

### Q8: Evaluation History Storage
- **Answer:** JSON files (Phase 1), SQLite/PostgreSQL (Phase 2)

### Q9: Categories for Scoring Rubric
- **Answer:** 6 categories — Experience Relevance, Skills & Keywords, Achievements, Education & Certifications, Format & Clarity, ATS Compatibility

### Q10: Dark Mode Strategy
- **Answer:** CSS class toggle on `<body>`: `dark-mode` — uses CSS custom properties for seamless switching. Preference stored in localStorage + session

---

## 🔧 LangChain Integration

### AI Client (DeepSeek v4 via Zen API)
```python
ZEN_BASE_URL = "https://opencode.ai/zen/v1"
ZEN_MODEL = "deepseek-v4-flash-free"

client = OpenAI(
    api_key=os.getenv("ZEN_API_KEY", ""),
    base_url=ZEN_BASE_URL,
)
```

### Prompt Pattern
```python
EVALUATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert resume reviewer with 15 years of experience in tech hiring.
Evaluate this resume across 6 categories with scores 0-100.

FAIRNESS INSTRUCTION:
- Do NOT penalize candidates for employment gaps, non-traditional education, non-English names.
- Focus on skills, achievements, and relevance — not pedigree.
- Return structured JSON matching the schema provided."""),
    ("user", "Resume:\n{resume_text}\n\nTarget Role: {target_role}"),
])
```

### Pydantic Schema
```python
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

---

## 🏛️ Architecture — Flask Monolith

```
                    ┌──────────────────────────────────────┐
                    │         USER'S BROWSER                │
                    └──────────────┬───────────────────────┘
                                  │  HTTP Requests
                                  ▼
        ┌─────────────────────────────────────────────────────────┐
        │                    RENDER.COM                            │
        │  ┌─────────────────────────────────────────────────────┐ │
        │  │           Gunicorn (WSGI Server)                     │ │
        │  │           ┌─────────────────────────────┐           │ │
        │  │           │   Flask Application Instance  │           │ │
        │  │  ┌───────▼──────────────────────────┐   │           │ │
        │  │  │  FRONTEND (Server-Side Rendered)  │   │           │ │
        │  │  │  / → templates/index.html        │   │           │ │
        │  │  │  /upload → templates/upload.html  │   │           │ │
        │  │  │  /results → templates/results.html│   │           │ │
        │  │  └──────────┬───────────────────────┘   │           │ │
        │  │             │  (same process)            │           │ │
        │  │  ┌──────────▼───────────────────────┐   │           │ │
        │  │  │  BACKEND (Python Logic)           │   │           │ │
        │  │  │  Parse resume (PyMuPDF)          │   │           │ │
        │  │  │  Call DeepSeek (LangChain)        │   │           │ │
        │  │  │  Store results (JSON/SQLite)      │   │           │ │
        │  │  │  Auth (Flask sessions)            │   │           │ │
        │  │  └──────────────────────────────────┘   │           │ │
        │  └─────────────────────────────────────────┘           │
        └─────────────────────────────────────────────────────────┘
```

---

## 📄 Existing Files

| File | Status | Description |
|------|--------|-------------|
| `CLAUDE.md` | ✅ Complete (520 lines) | Project constitution — all sections, all CLARIFY decisions, full code examples |
| `docs/Specs.md` | ✅ Complete (1078 lines) | Full specs with RESEARCH→SPECIFY→CLARIFY→BUILD for all 10 features |
| `docs/research/research-brief.md` | ✅ Complete | Competitive analysis of 12 resume tools, AI eval approaches, parsing, bias/fairness |
| `Constitution.md` | ✅ Exists (empty template) | Initial inspiration for CLAUDE.md |
| `Spec As A Refrence.md` | ✅ Exists | RESEARCH→SPECIFY→CLARIFY→BUILD framework skeleton |

---

## 🔐 Security & Compliance

- **Auth:** Flask session-based auth + Google OAuth via `authlib`
- **Authorization:** Users can only access their own evaluations
- **Rate Limiting:** Flask-Limiter on `/evaluate` endpoint — 10 evals/day free tier
- **File Upload:** Limit to `.pdf`, `.docx`, `.txt`; max 5 MB; validate MIME type server-side
- **Upload Retention:** 30-day auto-delete for uploaded files and evaluations
- **Prompt Injection:** Sanitize resume content before inserting into prompts
- **Audit Trail:** Log every evaluation request with user ID, timestamp, and file hash
- **Anonymous Eval:** Optional checkbox to mask PII before LLM analysis
- **Slow Eval (>15s):** Loading spinner + retry button
- **Cold Start:** Loading spinner *"Waking up the app..."*; Phase 2: cron-job.org pinger

---

## 🚀 Development Roadmap

### Phase 1 — MVP (Week 1-2)
- [ ] File upload (drag & drop) with validation
- [ ] PDF/DOCX text extraction (PyMuPDF + python-docx)
- [ ] PII stripping before LLM call
- [ ] LangChain evaluation chain → DeepSeek v4
- [ ] Results page: score gauge + category breakdown + feedback
- [ ] Auth: email/password + Google OAuth

### Phase 2 — Core (Week 3-4)
- [ ] Job description comparison (optional target role input)
- [ ] ATS compatibility analysis
- [ ] Bias flagging in evaluation output
- [ ] Evaluation history dashboard
- [ ] Export results as PDF

### Phase 3 — Polished (Week 5+)
- [ ] Async processing queue for large files
- [ ] Cover letter generation based on resume gaps
- [ ] Improvement tracking over time
- [ ] Admin analytics dashboard
- [ ] cron-job.org pinger to prevent cold start

---

## ❗ Key Errors & Fixes (History)

1. **Wrong Tech Stack (Critical):** Initially built on Next.js 14 + TypeScript + Firebase (mirroring Task 1). User corrected to Python/Flask/LangChain per actual requirements. **Fix:** Complete rewrite of both CLAUDE.md and Specs.md.

2. **Missing Architecture Diagram:** Flask monolith was not documented. User asked for verification. **Fix:** Added Section II.A to CLAUDE.md with full ASCII diagram + Gunicorn details + Specs.md Architecture Overview.

3. **Missing CLARIFY Decisions:** 7 of 10 CLARIFY decisions not in files after CLARIFY phase. **Fix:** All 10 decisions now documented in both CLAUDE.md and Specs.md.

4. **Slow Research Agents:** User complained twice about long wait times. Running 6 parallel deep-research agents with web searches. **Fix:** Killed all running agents.

---

*Use this summary to quickly restore session context when resuming work.*
