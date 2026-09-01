# 🤖 Internee — Generative AI Chatbot Internship

> **Intern:** Sohaib Khattak (AI Engineer)

This repository contains all tasks completed during the Generative AI Chatbot Internship. Each task is in its own dedicated folder with full documentation, source code, and specifications.

---

## 📂 Repository Structure

```
Internee-GenerativeAI-Chatbot-Internship/
├── README.md                          # Repository overview
├── task-1-ai-personalized-learning-assistant/  # AI-powered personalized learning platform
│                                              # (Next.js + Firebase + DeepSeek v4)
│
├── task-2-ai-resume-evaluator/        # AI-driven resume evaluation system
│   ├── CLAUDE.md                      # Project constitution
│   ├── app.py                         # Flask application entry point
│   ├── src/                           # Application source code
│   ├── templates/                     # Jinja2 HTML templates
│   ├── static/                        # CSS and JavaScript assets
│   ├── tests/                         # Test suite (40+ tests)
│   ├── docs/                          # Specifications and research
│   ├── requirements.txt               # Python dependencies
│   ├── Procfile                       # Render deployment config
│   └── runtime.txt                    # Python version
│
├── task-3-ai-chatbot-for-intern-queries/  # GenAI chatbot for intern queries
│   ├── CLAUDE.md                      # Project constitution
│   ├── app/                           # Flask application source
│   │   ├── api/                       # REST/SSE endpoints (chat, health, analytics)
│   │   ├── core/                      # RAG engine, LLM client, sessions, cache
│   │   ├── integrations/              # Telegram & WhatsApp adapters
│   │   ├── static/                    # Web widget assets (robot mascot)
│   │   └── templates/                 # HTML web widget
│   ├── knowledge-base/                # Internee.pk FAQs (JSON)
│   ├── config.py                      # App configuration
│   ├── run.py / wsgi.py               # Dev / production entry points
│   ├── requirements.txt               # Python dependencies
│   ├── Procfile / render.yaml         # Render deployment config
│   └── runtime.txt                    # Python version
│
└── task-4-ai-career-path-recommender/  # AI career path recommender
    ├── CLAUDE.md                      # Project constitution
    ├── specs/                         # Research & feature specifications
    ├── src/                           # Recommender, matcher, profile, LLM modules
    ├── static/                        # Single-page web UI
    ├── tests/                         # Test suite (53 tests)
    ├── data/                          # Career catalogue (JSON)
    ├── requirements.txt               # Python dependencies
    └── .env.example                   # Google Gemini API key template
```

---

## 📋 Completed Tasks

| # | Task | Tech Stack | Status |
|---|------|-----------|--------|
| 1 | **AI Personalized Learning Assistant** | Next.js 14, TypeScript, Firebase, DeepSeek v4 | ✅ Complete |
| 2 | **AI Resume Evaluator** | Python 3.11+, Flask, LangChain, DeepSeek v4 | ✅ Complete |
| 3 | **GenAI Chatbot for Intern Queries** | Python 3.11+, Flask, Google Gemini, SQLite | ✅ Complete |
| 4 | **AI Career Path Recommender** | Python 3.11+, Flask, Google Gemini, NumPy | ✅ Complete |

---

## 🚀 Quick Start

### Task 4 — AI Career Path Recommender
```bash
cd task-4-ai-career-path-recommender
pip install -r requirements.txt
# Add your Google Gemini API key to .env (see .env.example)
python -m src.web
# Open http://127.0.0.1:5000
```

### Task 3 — GenAI Chatbot for Intern Queries
```bash
cd task-3-ai-chatbot-for-intern-queries
pip install -r requirements.txt
# Add your Google Gemini API key to .env (see .env.example)
python run.py
# Open http://localhost:5000
```

### Task 2 — AI Resume Evaluator
```bash
cd task-2-ai-resume-evaluator
pip install -r requirements.txt
python app.py
```

### Task 1 — AI Personalized Learning Assistant
```bash
cd task-1-ai-personalized-learning-assistant
npm install
npm run dev
```

---

## 🛡️ License & Attribution

© 2026 Sohaib Khattak — All rights reserved.
