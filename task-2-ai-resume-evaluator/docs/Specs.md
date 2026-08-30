# 📋 AI Resume Evaluator — Project Specifications

**Compiled:** 2026-07-14  
**Status:** Pre-development Spec  
**Framework:** RESEARCH → SPECIFY → CLARIFY → BUILD  

---

## Table of Contents

0. [Architecture Overview — Flask Monolith](#architecture-overview--flask-monolith-frontend--backend-combined)
1. [Feature 1: Resume Upload & File Processing](#1-resume-upload--file-processing)
2. [Feature 2: Resume Parsing & Text Extraction](#2-resume-parsing--text-extraction)
3. [Feature 3: AI-Powered Evaluation (LangChain + DeepSeek v4)](#3-ai-powered-evaluation-langchain--deepseek-v4)
4. [Feature 4: Scoring & Rubric](#4-scoring--rubric)
5. [Feature 5: Feedback & Suggestions](#5-feedback--suggestions)
6. [Feature 6: Bias Detection & Fairness](#6-bias-detection--fairness)
7. [Feature 7: User Dashboard & History](#7-user-dashboard--history)
8. [Feature 8: Authentication & User Management](#8-authentication--user-management)
9. [Feature 9: Results Display & Visualization](#9-results-display--visualization)
10. [Feature 10: Performance & Error Handling](#10-performance--error-handling)
11. [Project Configuration](#11-project-configuration)
12. [Development Roadmap](#12-development-roadmap)

---

## Architecture Overview — Flask Monolith (Frontend + Backend Combined)

### How Flask Serves Everything as One Project

Flask is a **monolithic framework** — it serves both the frontend HTML pages AND the backend logic from a **single running process**. There is no separate frontend build, no REST API server, no CORS configuration needed.

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
| **Flask renders HTML** | Jinja2 templates processed on server, sent as finished HTML to browser |
| **No API server needed** | No REST API, no GraphQL, no CORS — Flask handles everything internally |
| **Gunicorn** | Production WSGI server that runs Flask. Handles multiple concurrent requests |
| **Static files** | CSS/JS/images served directly from `static/` folder by Flask |

### Why Combined Architecture Works for This Project

| Concern | How Flask handles it |
|---------|---------------------|
| **No CORS issues** | Frontend and backend are same origin — no cross-origin problems |
| **Simpler deployment** | One `gunicorn app:app` command starts everything |
| **Faster pages** | HTML rendered server-side, no client-side JS framework needed |
| **Session management** | Flask sessions work seamlessly — no JWT tokens or auth headers |
| **File uploads** | Direct `request.files` handling, no multipart form quirks |

### Production Startup (Gunicorn)

```bash
# Command Render runs to start the app
gunicorn app:app --bind 0.0.0.0:10000 --workers 4 --timeout 120
```

- `app:app` = Flask instance named `app` inside `app.py`
- `--workers 4` = handles up to 4 requests concurrently
- `--timeout 120` = 2-minute timeout for long AI evaluations (far beyond Vercel's 10s limit)

### Single Deployment on Render

| What | How |
|------|-----|
| **One repo** | Code pushed to GitHub |
| **One service** | Render detects Flask, runs `gunicorn app:app` |
| **One URL** | `https://your-app.onrender.com` |
| **Everything works** | HTML pages, CSS, file uploads, AI calls — all from one URL |

---

## 1. Resume Upload & File Processing

### RESEARCH

**How this is usually done:**
- Flask apps handle file uploads via `request.files` in route handlers
- Files are saved to disk or processed in-memory
- Validation (MIME type, size, extension) happens server-side before any processing
- Werkzeug's `secure_filename` sanitizes filenames
- Flash messages display success/error states

**Main approaches and trade-offs:**

| Approach | Pros | Cons |
|----------|------|------|
| **Save to disk → process** | Simple, file persists for debugging | Disk usage, cleanup needed |
| **In-memory processing** | No disk I/O, faster | Memory pressure with large files |
| **Cloud storage (S3/GCS)** | Scalable, persistent | Extra dependency, setup complexity |

**Our project context:**
- Python 3.11+ / Flask — files handled via Flask's built-in `request.files`
- Free hosting (Render/Railway): ephemeral filesystem
- No persistent storage dependency for Phase 1 — process in-memory
- Target users: job seekers uploading individual resumes
- DeepSeek v4 call adds ~2-5s latency — total within acceptable range

**Failure modes and edge cases:**
- Empty file upload → reject with flash message
- Corrupted PDF/DOCX → graceful error during parsing stage
- File with malicious content → MIME validation + extension check + `secure_filename`
- Network interruption → Flask handles via form data (all-or-nothing)
- Concurrent uploads → Flask-Limiter for rate limiting per IP
- Unicode filenames → `werkzeug.utils.secure_filename` sanitization

### SPECIFY

**Goal:** Allow users to upload their resume (PDF, DOCX, or TXT) securely, validate it server-side, and prepare it for evaluation.

**User scenarios:**
1. **Logged-in user** visits `/upload`, selects a PDF resume → sees file info + "Evaluate" button
2. **User selects wrong file** → removes it and picks the correct one
3. **User tries uploading a .png image** → sees error: *"Unsupported format. Use PDF, DOCX, or TXT."*
4. **User uploads a 10MB file** → sees error: *"File too large. Max size is 5 MB."*

**Functional requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FU-1 | File upload form with drag-and-drop zone + click-to-browse | P0 |
| FU-2 | Accept only `.pdf`, `.docx`, `.txt` — server-validate MIME type | P0 |
| FU-3 | Max file size: 5 MB (server-enforced) | P0 |
| FU-4 | Display file name, size, and type after selection | P0 |
| FU-5 | Allow user to remove selected file and re-upload | P0 |
| FU-6 | Optional "Target Role / Job Description" textarea | P1 |
| FU-7 | Show extracted text preview before evaluation | P1 |
| FU-8 | Flash messages for upload success/error states | P1 |
| FU-9 | Optional checkbox: "Enable anonymous evaluation (mask my name)" — masks candidate name before LLM analysis | P1 |

**Edge cases & rules:**
- Files > 5 MB → reject: *"File too large. Max 5 MB."*
- Unsupported formats → reject: *"Unsupported format. Use PDF, DOCX, or TXT."*
- Empty files (0 bytes) → reject: *"File appears to be empty."*
- Only one file accepted at a time
- User must be authenticated (redirect to `/login` if not)
- Accepted files are kept on disk for **30 days** (matching evaluation TTL), then auto-deleted
- Free tier limited to **10 evaluations/day** — on limit hit, show message + upsell to Pro
- **Cold start**: Render free tier sleeps after 15min inactivity. First request shows *"Waking up the app..."* loading spinner. Phase 2: add cron-job.org pinger to prevent sleep.

**Out of scope:**
- Batch/multiple file uploads
- Image-based resume (OCR)
- URL-based import (LinkedIn, Google Drive)

**Acceptance criteria:**
1. ✅ User can drag-and-drop a PDF onto upload zone → file name/size displayed
2. ✅ User can click to browse files and select a DOCX
3. ✅ Invalid file type (e.g., .png) shows error and blocks submission
4. ✅ File over 5 MB shows error and blocks submission
5. ✅ User can remove selected file and pick a different one
6. ✅ Optional "Target Role" textarea is present and editable
7. ✅ "Evaluate" button is disabled until a valid file is selected
8. ✅ Unauthenticated users are redirected to login

### CLARIFY

1. *Save to disk or in-memory?* → **In-memory** — free hosting has ephemeral storage.
2. *Allow re-uploading same file?* → **Yes**, each upload creates a new evaluation.
3. *Max evaluations per day?* → **10/day free tier**, unlimited Pro tier.

---

## 2. Resume Parsing & Text Extraction

### RESEARCH

**How this is usually done:**
- PDF extraction: `PyMuPDF` (fitz) — fastest Python PDF text extractor
- DOCX extraction: `python-docx` — iterates paragraphs, returns clean text
- TXT: direct UTF-8 read
- Scanned documents: OCR via `pytesseract` or cloud Vision API

**Main approaches and trade-offs:**

| Library | Format | Accuracy | Pros | Cons |
|---------|--------|----------|------|------|
| **PyMuPDF (fitz)** | PDF | ~90% (digital) | Very fast, Python-native | Fails on scanned PDFs |
| **pdfminer.six** | PDF | ~92% | Better text positioning | Slower |
| **pdfplumber** | PDF | ~93% | Good with tables | Heavier dependency |
| **python-docx** | DOCX | ~95% | Clean text output | No formatting preserved |
| **pytesseract** | Scanned | ~80% | Free OCR | Requires Tesseract binary |

**Our project context:**
- Python/Flask — all libraries pip-installable
- Processing happens synchronously inside Flask route
- DeepSeek v4 context window > most resumes (~128K tokens)
- Target: extract clean text, discard formatting, preserve content
- No OCR for Phase 1 — inform user if scanned PDF detected

**Failure modes and edge cases:**
- Password-protected PDF → PyMuPDF raises exception → catch and message user
- Scanned PDF (image-only, no text layer) → extraction returns empty → notify
- Corrupted file → PyMuPDF/python-docx raises → graceful catch
- Very long resumes (>10 pages) → truncate at 50,000 characters
- Non-UTF-8 encoded DOCX → detect encoding, convert to UTF-8
- Empty document → returns empty string → evaluation returns zero scores

### SPECIFY

**Goal:** Extract clean, readable text from uploaded resume files regardless of format.

**User scenarios:**
1. **User uploads a digital PDF** → text extracted, preview shown before evaluation
2. **User uploads a DOCX** → paragraphs extracted as clean text
3. **User uploads a TXT** → content read directly
4. **User uploads a scanned/image PDF** → message: *"No text could be extracted. Try a digital PDF."*

**Functional requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| RP-1 | Extract text from PDF using PyMuPDF (fitz) | P0 |
| RP-2 | Extract text from DOCX using python-docx | P0 |
| RP-3 | Read TXT files as UTF-8 text | P0 |
| RP-4 | Normalize whitespace (collapse multiple spaces, trim) | P1 |
| RP-5 | Detect scanned PDFs (empty extraction result) and notify user | P1 |
| RP-6 | Truncate text exceeding 50,000 characters with notice | P1 |
| RP-7 | Show extracted text preview before evaluation (first 500 chars) | P1 |

**Edge cases & rules:**
- Password-protected → *"File is password-protected. Remove protection first."*
- Empty extraction → *"Could not extract text. Try a different file format."*
- Extraction > 5 seconds → log warning, serve truncated result
- Max extracted text: 50,000 characters

**Out of scope:**
- OCR for scanned/image-based resumes (Phase 2)
- Table structure preservation
- Bullet point detection and structuring

**Acceptance criteria:**
1. ✅ PDF with text layer extracts all visible text
2. ✅ DOCX extracts all paragraph text
3. ✅ TXT reads content correctly
4. ✅ Password-protected PDF shows clear error message
5. ✅ Scanned PDF (no text layer) shows "try a digital PDF" message
6. ✅ Extracted text preview shown before evaluation
7. ✅ Text > 50K chars truncated with notice displayed to user

### CLARIFY

1. *Keep extracted text in session or extract fresh each time?* → **Extract fresh each evaluation.** Store only results.
2. *OCR from the start?* → **No.** Phase 2. Phase 1: guide user to use digital PDF.
3. *Non-English resume handling?* → Assume English for Phase 1. Normalize to UTF-8.

---

## 3. AI-Powered Evaluation (LangChain + DeepSeek v4)

### RESEARCH

**How this is usually done:**
- LangChain chains orchestrate prompts → LLM → output parsing
- `ChatPromptTemplate` structures system/user messages
- `StructuredOutputParser` or Pydantic parser extracts typed data
- Temperature tuning: 0.2–0.3 for consistent scoring, 0.7 for creative suggestions
- Many include a target job description for role-specific scoring

**Main approaches and trade-offs:**

| Approach | Pros | Cons |
|----------|------|------|
| **Single LLMChain** (one call → all scores) | Fast, simple, one latency penalty | May miss nuance |
| **Multi-chain** (one per category) | More detailed, can parallelize | Higher total latency |
| **Two-pass** (summary → detailed) | Better first-pass accuracy | More complex orchestration |

**Our project context:**
- LangChain framework with `ChatOpenAI` model class
- DeepSeek v4 (free) via OpenCode Zen API — cost: **$0/evaluation**
- JSON mode: `model_kwargs={"response_format": {"type": "json_object"}}`
- Pydantic schemas validate LLM output at the boundary
- All prompt templates stored in `src/ai/prompts.py`
- Vercel-style timeout constraints don't apply — Flask render hosting has longer timeouts

**Failure modes and edge cases:**
- LLM returns malformed JSON → Pydantic catches, retry once
- LLM timeout (>10s) → retry once, then return error
- API key invalid/missing → log error, return configuration error
- Rate limited by Zen API → exponential backoff retry
- Empty/nonsensical response → catch, retry once
- Hallucinated scores (e.g., 150/100 or -5) → Pydantic Field(ge=0, le=100) catches

### SPECIFY

**Goal:** Use DeepSeek v4 (free) via OpenCode Zen API through LangChain to evaluate resumes, returning validated Pydantic output.

**User scenarios:**
1. **User uploads resume + clicks "Evaluate"** → receives score across 6 categories within 3–10s
2. **User pastes a target job description** → evaluation is tailored to that specific role
3. **User evaluates without target role** → evaluation follows general best practices

**Functional requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| AI-1 | Send extracted text to DeepSeek v4 via LangChain `LLMChain` | P0 |
| AI-2 | Use JSON response format for structured output | P0 |
| AI-3 | Validate LLM response against Pydantic `Evaluation` schema | P0 |
| AI-4 | Include target role / job description as optional context in prompt | P1 |
| AI-5 | Retry once on failure (timeout or malformed JSON) | P1 |
| AI-6 | Log metadata: tokens used, latency, model name | P1 |

**LangChain Setup:**

```python
# src/ai/client.py
from config import Config

GEMINI_MODEL = Config.GEMINI_MODEL  # e.g. "gemini-3.5-flash"

def get_model() -> str:
    return GEMINI_MODEL
```

```python
# src/ai/prompts.py
from langchain.prompts import ChatPromptTemplate

EVALUATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert resume reviewer with 15 years of experience in tech hiring.
Evaluate this resume across 6 categories with scores 0-100.

FAIRNESS INSTRUCTION:
- Do NOT penalize candidates for employment gaps, non-traditional education,
  non-English names, or protected characteristics.
- If evaluation criteria seems biased, flag it in biasWarnings.
- Focus on skills, achievements, and relevance — not pedigree.

Return JSON matching this schema:
{{
  "overall_score": int (0-100),
  "categories": [
    {{
      "name": str,
      "score": int (0-100),
      "reasoning": str (min 10 chars),
      "suggestions": [str]
    }}
  ],
  "summary": str | null,
  "strengths": [str] | null,
  "improvements": [{{"issue": str, "suggestion": str, "priority": "high"|"medium"|"low"}}] | null,
  "bias_warnings": [str] | null
}}"""),
    ("user", "Resume:\n{resume_text}\n\nTarget Role: {target_role}"),
])
```

```python
# src/ai/chains.py
from langchain_google_genai import ChatGoogleGenerativeAI
from config import Config
from src.ai.prompts import EVALUATION_PROMPT
from src.ai.parsers import EvaluationParser

def get_evaluation_chain():
    llm = ChatGoogleGenerativeAI(
        model=Config.GEMINI_MODEL,
        google_api_key=Config.GEMINI_API_KEY,
        temperature=0.3,
        response_mime_type="application/json",
        max_tokens=4096,
    )
    return EVALUATION_PROMPT | llm | EvaluationParser()
```

**Temperature settings:**
- Scoring: `temperature: 0.3`
- Suggestion generation: `temperature: 0.7` (Phase 2)

**Edge cases & rules:**
- Empty extracted text → return all-zero scores with `status: "failed"`
- Target role > 2000 chars → truncate with "Target role truncated" notice
- Invalid JSON 2× in a row → return `AI_PROCESSING_ERROR`
- All scores clamped 0-100 by Pydantic
- **Slow evaluation (>15s)**: Show message *"This is taking longer than usual. You can wait or [try again]"* with a retry button. Page uses simple sync loading spinner for the first 15s.

**Out of scope:**
- Multi-provider fallback (OpenAI, Gemini)
- Batch evaluation of multiple resumes
- Custom rubrics defined by users

**Acceptance criteria:**
1. ✅ Valid resume text returns complete `Evaluation` Pydantic object
2. ✅ Pydantic schema validates all fields (scores 0-100, lists non-empty)
3. ✅ Providing a target role modifies scoring to match that role
4. ✅ Empty text returns scores of 0 with error indicator
5. ✅ Invalid LLM response triggers one retry
6. ✅ Evaluation completes within 10 seconds
7. ✅ All errors returned as structured JSON via Flask route

### CLARIFY

1. *Full rubric in every prompt or reference?* → **Full rubric.** Short and ensures consistency.
2. *Cache evaluations for same file?* → **No.** Each evaluation is fresh. History shows previous results.
3. *What if Zen API is down?* → Show error with "Try again" button. Phase 2: fallback.

---

## 4. Scoring & Rubric

### RESEARCH

**How this is usually done:**
- Competitors use weighted category scores (Rezi: 23 criteria, Jobscan: weighted)
- Scores are 0-100 with color coding (red/amber/green)
- Most do NOT publish their rubric — ours will be **fully transparent**

### SPECIFY

**Goal:** Provide a clear, transparent, weighted scoring rubric across 6 categories with explainable scores 0-100.

**Scoring Rubric:**

| # | Category | Weight | What It Measures |
|---|----------|--------|-----------------|
| 1 | **Experience Relevance** | 30% | Role alignment, career progression, relevant years |
| 2 | **Skills & Keywords** | 25% | Hard skills, tools, technologies, certifications |
| 3 | **Achievements & Impact** | 15% | Quantified results, metrics, specific accomplishments |
| 4 | **Education & Credentials** | 10% | Degree relevance, certifications, continuous learning |
| 5 | **Format & Clarity** | 10% | Structure, readability, conciseness, grammar |
| 6 | **ATS Compatibility** | 10% | Keyword density, parsability, standard formatting |

**Score Interpretation:**

| Range | Label | Color | Meaning |
|-------|-------|-------|---------|
| 81–100 | Excellent | `#14b8a6` (teal) | Highly competitive resume |
| 61–80 | Good | `#3b82f6` (blue) | Solid with room to improve |
| 41–60 | Fair | `#f59e0b` (amber) | Several areas need work |
| 0–40 | Critical | `#ef4444` (red) | Major improvements needed |

**Overall Score Formula:**
```
overall_score = round(
    experience.score × 0.30 +
    skills.score × 0.25 +
    achievements.score × 0.15 +
    education.score × 0.10 +
    format.score × 0.10 +
    ats.score × 0.10
)
```

**Pydantic Schema:**
```python
# src/models/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional

class Category(BaseModel):
    name: str
    score: int = Field(ge=0, le=100)
    reasoning: str = Field(min_length=10)
    suggestions: List[str] = Field(min_length=1)

class Improvement(BaseModel):
    issue: str
    suggestion: str
    priority: str  # "high", "medium", "low"

class Evaluation(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    categories: List[Category] = Field(min_length=1)
    summary: Optional[str] = None
    strengths: Optional[List[str]] = None
    improvements: Optional[List[Improvement]] = None
    bias_warnings: Optional[List[str]] = None
    ats_compatibility: Optional[dict] = None
```

**Score color CSS classes:**
```css
.score-excellent { color: #14b8a6; }
.score-good { color: #3b82f6; }
.score-fair { color: #f59e0b; }
.score-critical { color: #ef4444; }

.bg-score-excellent { background-color: #14b8a6; }
.bg-score-good { background-color: #3b82f6; }
.bg-score-fair { background-color: #f59e0b; }
.bg-score-critical { background-color: #ef4444; }
```

**Acceptance criteria:**
1. ✅ Overall score is weighted average of 6 categories
2. ✅ Each category has score (0-100) + reasoning (min 10 chars) + suggestions (min 1)
3. ✅ Score color matches the range scale
4. ✅ Reasoning cites specific resume content (not generic)
5. ✅ Weights visible to user (transparency)

---

## 5. Feedback & Suggestions

### SPECIFY

**Goal:** Provide actionable, prioritized, specific feedback that helps users improve their resume.

**Functional requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| FB-1 | Show strengths list (categories scoring ≥ 70) | P0 |
| FB-2 | Show improvements grouped by priority (high, medium, low) | P0 |
| FB-3 | Each improvement includes: issue statement + suggestion for fix | P0 |
| FB-4 | Suggestions are specific and reference resume content | P1 |
| FB-5 | Include before/after example for high-priority improvements | P2 |
| FB-6 | **Export as PDF** with checkboxes letting user choose what to include (overall score, categories, strengths, improvements, bias warnings, summary) | P2 |

**Edge cases & rules:**
- Minimum 1 suggestion per category scoring below 70
- No contradictory suggestions across categories
- If all categories below 40, strengths list is empty
- Cannot suggest adding technologies the resume doesn't support

**Acceptance criteria:**
1. ✅ Strengths displayed for categories scoring 70+
2. ✅ Improvements sorted by priority (high → medium → low)
3. ✅ Each improvement has both an issue and a concrete suggestion
4. ✅ Suggestions reference specific resume content (not generic)
5. ✅ No contradictory suggestions across categories

---

## 6. Bias Detection & Fairness

### RESEARCH

**How this is usually done:**
- **No major competitor does explicit bias detection** — this is our key differentiator
- NYC Local Law 144 requires bias audits for automated hiring tools
- EEOC guidelines prohibit adverse impact on protected groups
- GDPR requires "right to explanation" for automated decisions

### SPECIFY

**Goal:** Detect and mitigate potential bias through PII masking, bias-aware prompting, and transparent flagging.

**User scenarios:**
1. **Candidate submits resume with employment gaps** → not penalized in scoring
2. **Resume contains potentially biased criteria** → bias warning displayed in results
3. **Recruiter uses tool** → sees bias warnings for fairer decision-making

**Functional requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| BD-1 | Strip PII (email, phone, address, URLs) before sending to LLM | P0 |
| BD-2 | Include fairness clause in every evaluation prompt | P0 |
| BD-3 | Display `bias_warnings` in results if LLM detects potential bias | P0 |
| BD-4 | Never auto-reject — AI scores are advisory, never final | P0 |
| BD-5 | Show "AI-generated, not a human decision" disclaimer | P1 |

**PII masking (Python):**
```python
# src/resume/pii.py
import re

def mask_pii(text: str) -> str:
    """Remove personal identifiable information before LLM analysis."""
    text = re.sub(r'\S+@\S+\.\S+', '[EMAIL REDACTED]', text)
    text = re.sub(r'\+?\d[\d\s.\-()]{7,}', '[PHONE REDACTED]', text)
    text = re.sub(r'https?://\S+', '[URL REDACTED]', text)
    text = re.sub(
        r'\d{1,5}\s+\w+\s+(Street|St|Ave|Avenue|Rd|Road|Blvd|Dr|Drive|Ln|Lane)\b',
        '[ADDRESS REDACTED]',
        text,
        flags=re.IGNORECASE
    )
    return text
```

**Anonymous evaluation (optional):**
- Upload page includes checkbox: *"Enable anonymous evaluation (mask my name)"*
- When checked, name patterns are detected via regex and replaced with `[NAME REDACTED]`
- When unchecked, name is left intact for full context
- Controlled via `pii.py` utility:
```python
def mask_name(text: str, enabled: bool) -> str:
    if not enabled:
        return text
    # Simple name pattern: titles + capitalized words at start of text
    text = re.sub(r'^(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)?\s*[A-Z][a-z]+\s+[A-Z][a-z]+', '[NAME REDACTED]', text)
    return text
```

**Fairness prompt clause (in every system prompt):**
```
FAIRNESS INSTRUCTION:
- Do NOT penalize candidates for employment gaps, non-traditional education,
  non-English names, or protected characteristics.
- If evaluation criteria itself seems biased, flag it in biasWarnings.
- Focus on skills, achievements, and relevance — not pedigree.
```

**Edge cases & rules:**
- Bias warnings are informational only — not blocking
- PII masking must not destroy resume context (names kept for relevance)
- Employment gaps must not affect scoring negatively
- University/institution prestige must not be a scoring factor
- Career changes and non-linear paths must not be penalized

**Out of scope:**
- Full bias audit report
- Automated adverse impact analysis
- Demographic parity scoring

**Acceptance criteria:**
1. ✅ PII is masked before resume text reaches LLM
2. ✅ Evaluation prompt includes fairness clause
3. ✅ Bias warnings displayed in results when potential bias detected
4. ✅ Employment gaps do not reduce overall score
5. ✅ Result page states "AI-generated evaluation" disclaimer
6. ✅ All scores include specific reasoning (transparency)

---

## 7. User Dashboard & History

### SPECIFY

**Goal:** Provide users with a dashboard showing evaluation history, average scores, and quick access to re-evaluate.

**Data storage approach:**
- Phase 1: JSON file per user stored in `data/{user_id}.json`
- Phase 2: Migrate to SQLite or PostgreSQL

**JSON schema (per user):**
```json
{
  "user_id": "user_abc123",
  "evaluations": [
    {
      "id": "eval_001",
      "created_at": "2026-07-14T10:30:00Z",
      "file_name": "resume.pdf",
      "overall_score": 74,
      "status": "completed"
    }
  ],
  "stats": {
    "total_evaluations": 5,
    "average_score": 71
  }
}
```

**Functional requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| DH-1 | Dashboard shows total evaluations count | P0 |
| DH-2 | Dashboard shows average score across all evaluations | P0 |
| DH-3 | Recent evaluations list (last 5) with filename, score, date | P0 |
| DH-4 | Click evaluation → full results page | P0 |
| DH-5 | "New Evaluation" button → `/upload` page | P0 |
| DH-6 | Full history page with paginated list | P1 |
| DH-7 | Delete individual evaluation from history | P1 |

**Acceptance criteria:**
1. ✅ Dashboard loads with stats and recent list
2. ✅ Average score calculated correctly
3. ✅ Recent evaluations clickable → navigate to full results
4. ✅ "New Evaluation" button navigates to upload page
5. ✅ User can delete evaluations from history

---

## 8. Authentication & User Management

### SPECIFY

**Goal:** Secure user authentication using Flask sessions with bcrypt-hashed passwords.

**Auth approach:**
- Flask sessions for auth state (`session['user_id']`)
- Email/password with Werkzeug `generate_password_hash` / `check_password_hash`
- Google OAuth via `authlib` library
- `@login_required` decorator for protected routes
- Phase 1: JSON file storage. Phase 2: database.

**Functional requirements:**

| ID | Requirement | Priority |
|----|-------------|----------|
| AU-1 | Sign up with email + password | P0 |
| AU-2 | Login with email + password | P0 |
| AU-2b | Sign in with Google (via authlib) | P0 |
| AU-3 | Logout clears session | P0 |
| AU-4 | Protected routes redirect to `/login` | P0 |
| AU-5 | Flask session persists across requests | P0 |
| AU-6 | Password hashing with Werkzeug | P0 |
| AU-7 | Password reset via email | P1 |
| AU-8 | Account deletion with data purge | P2 |

**Auth pattern:**
```python
from flask import session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function
```

**Acceptance criteria:**
1. ✅ User can sign up with email + password
2. ✅ User can log in with email + password
3. ✅ User can log out (session cleared)
4. ✅ Protected routes redirect to `/login` for unauthenticated users
5. ✅ Session persists across page reloads

---

## 9. Results Display & Visualization

### SPECIFY

**Goal:** Display evaluation results with clear, accessible, color-coded visualizations.

**Template structure:**
```
templates/
├── base.html            # Base layout: nav, footer, theme toggle
├── index.html           # Landing / home page
├── login.html           # Login form
├── signup.html          # Signup form
├── upload.html          # Upload resume + evaluate
├── results.html         # Full evaluation results page
├── history.html         # Evaluation history list
└── settings.html        # User preferences
```

**Results page layout (`results.html`):**
```
┌──────────────────────────────────────────────┐
│  AI Resume Evaluation                         │
├──────────────────────────────────────────────┤
│                                              │
│     ┌──────────────┐     Overall Score       │
│     │    ╭────╮    │     ──────────────      │
│     │    │ 74 │    │        74/100           │
│     │    ╰────╯    │     ● Good              │
│     │    Score     │                         │
│     └──────────────┘                         │
│                                              │
│  ─── Category Breakdown ───                  │
│                                              │
│  Experience Relevance  ████████░░  80%  30%  │
│  Skills & Keywords     ██████░░░░  65%  25%  │
│  Achievements          ███████░░░  72%  15%  │
│  Education & Creds     █████████░  88%  10%  │
│  Format & Clarity      ████████░░  78%  10%  │
│  ATS Compatibility     ██████░░░░  62%  10%  │
│                                              │
│  ─── ✅ Strengths ───                        │
│                                              │
│  ● Strong technical background aligned...    │
│  ● Quantified achievements in revenue...     │
│                                              │
│  ─── 🔧 Improvements ───                     │
│                                              │
│  🔴 HIGH  Add more industry keywords        │
│           Consider adding: Python, AWS...    │
│                                              │
│  🟡 MEDIUM Improve bullet point impact      │
│           Use action verbs + metrics...      │
│                                              │
│  ⚠️ Bias Warnings                            │
│  Employment gaps detected — not scored       │
├──────────────────────────────────────────────┤
│  [Evaluate Another]  [View History]          │
└──────────────────────────────────────────────┘
```

**Score color mapping:**
```python
def get_score_color(score: int) -> str:
    if score >= 81: return "#14b8a6"  # teal
    if score >= 61: return "#3b82f6"  # blue
    if score >= 41: return "#f59e0b"  # amber
    return "#ef4444"                   # red
```

---

## 10. Performance & Error Handling

### SPECIFY

**Performance budgets:**

| Metric | Target | Threshold |
|--------|--------|-----------|
| Evaluation latency (text → score) | < 5s | < 10s |
| Page load (initial) | < 2s | < 3s |
| PDF text extraction | < 3s | < 5s |
| DOCX text extraction | < 2s | < 4s |

**Error hierarchy (Python):**
```python
# src/utils/errors.py
class AppError(Exception):
    def __init__(self, message: str, code: str, status_code: int = 400, actionable: bool = False):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.actionable = actionable
        super().__init__(message)
```

**Error registry:**

| Error | AppError Code | HTTP | User Message |
|-------|--------------|------|-------------|
| File too large | `FILE_TOO_LARGE` | 413 | "File too large. Max 5 MB." |
| Unsupported format | `UNSUPPORTED_FORMAT` | 400 | "Use PDF, DOCX, or TXT." |
| Empty file | `EMPTY_FILE` | 400 | "File appears to be empty." |
| Extraction failed | `EXTRACTION_FAILED` | 422 | "Couldn't read file. Try another format." |
| Password protected | `PROTECTED_FILE` | 422 | "File is password-protected. Remove protection." |
| AI processing failed | `AI_PROCESSING_ERROR` | 500 | "Evaluation failed. Try again." |
| Schema validation | `VALIDATION_ERROR` | 500 | "Unexpected response. Try again." |
| Rate limited | `RATE_LIMITED` | 429 | "Too many requests. Please wait." |
| Unauthenticated | `UNAUTHORIZED` | 401 | "Please sign in first." |

**Flask error handler:**
```python
from flask import jsonify

def register_error_handlers(app):
    @app.errorhandler(AppError)
    def handle_app_error(error):
        return jsonify({
            "error": error.message,
            "code": error.code,
            "actionable": error.actionable,
        }), error.status_code

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Page not found", "code": "NOT_FOUND"}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "An unexpected error occurred", "code": "INTERNAL_ERROR"}), 500
```

---

## 11. Project Configuration

### requirements.txt

```txt
Flask==3.0.3
Flask-Limiter==3.7.0
Authlib==1.3.0
openai>=1.30.0
langchain>=0.2.5
langchain-openai>=0.1.9
python-dotenv>=1.0.1
PyMuPDF>=1.24.0
python-docx>=1.1.2
pydantic>=2.7.0
Werkzeug>=3.0.3
gunicorn>=22.0.0
```

### Project structure:
```
resume-evaluator/
├── app.py
├── config.py
├── requirements.txt
├── .env
├── .gitignore
├── templates/
│   ├── base.html
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   ├── upload.html
│   ├── results.html
│   ├── history.html
│   └── settings.html
├── static/
│   ├── css/style.css
│   └── js/main.js
├── src/
│   ├── __init__.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── upload.py
│   │   ├── results.py
│   │   └── history.py
│   ├── ai/
│   │   ├── __init__.py
│   │   ├── client.py
│   │   ├── prompts.py
│   │   ├── chains.py
│   │   └── parsers.py
│   ├── resume/
│   │   ├── __init__.py
│   │   ├── parser.py
│   │   └── pii.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py
│   └── utils/
│       ├── __init__.py
│       └── errors.py
└── tests/
    ├── __init__.py
    ├── test_parser.py
    ├── test_ai.py
    └── test_routes.py
```

### Environment variables (.env):

```env
# Flask
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=change-this-to-a-random-secret-key

# AI Provider (Google Gemini — free tier via personal API key)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta

# App Config
MAX_FILE_SIZE_MB=5
EVALUATION_TTL_DAYS=30
```

### Color palette reference:

| Name | Hex | Usage |
|------|-----|-------|
| `brand-50` | `#eff6ff` | Light backgrounds |
| `brand-500` | `#3b82f6` | Primary buttons, links |
| `brand-600` | `#2563eb` | Button hover |
| `brand-900` | `#172554` | Dark mode background |
| `accent-500` | `#14b8a6` | Success, high scores |
| `accent-600` | `#0d9488` | Accent hover |
| `amber-500` | `#f59e0b` | Medium scores, warnings |
| `red-500` | `#ef4444` | Low scores, errors |

### .gitignore:

```
__pycache__/
*.py[cod]
.env
venv/
*.db
data/
uploads/
```

---

## 12. Development Roadmap

### Phase 1 — MVP (Week 1-2)

| # | Task | Dependencies |
|---|------|-------------|
| 1 | Flask project scaffold + app.py + config | None |
| 2 | requirements.txt + venv setup | #1 |
| 3 | Static CSS (Professional Blue palette) + base.html | #1 |
| 4 | Auth routes: login, signup, logout + sessions | #3 |
| 5 | `@login_required` decorator + protected routes | #4 |
| 6 | Upload page: form, file validation, flash messages | #5 |
| 7 | PDF text extraction (PyMuPDF) | #6 |
| 8 | DOCX text extraction (python-docx) | #6 |
| 9 | PII masking utility | #8 |
| 10 | LangChain prompt templates + chains | #9 |
| 11 | Pydantic evaluation schema | #10 |
| 12 | Results page: score gauge + category breakdown | #11 |
| 13 | Error handling throughout (AppError + handlers) | All |

### Phase 2 — Core (Week 3-4)

| # | Task | Dependencies |
|---|------|-------------|
| 1 | Dashboard page (stats + recent evaluations) | Phase 1 |
| 2 | Full evaluation history page (paginated) | #1 |
| 3 | Target role / job description input | Phase 1 |
| 4 | Bias warning display in results | Phase 1 |
| 5 | Rate limiting (Flask-Limiter) | Phase 1 |
| 6 | Dark mode toggle | Phase 1 |
| 7 | Evaluation delete from history | #2 |

### Phase 3 — Polished (Week 5+)

| # | Task | Dependencies |
|---|------|-------------|
| 1 | Migrate storage to SQLite/PostgreSQL | Phase 2 |
| 2 | Cover letter suggestion generation | Phase 1 |
| 3 | Score trend chart (simple line chart) | Phase 2 |
| 4 | Export results as PDF | Phase 1 |
| 5 | Share results via unique link | Phase 2 |

---

*This spec follows the RESEARCH → SPECIFY → CLARIFY → BUILD framework from the project reference file.  
CLARIFY questions are listed per feature; resolve them before BUILD begins.*

**Last updated:** 2026-07-14
