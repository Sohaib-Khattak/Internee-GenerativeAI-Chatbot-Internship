# MEMORY — Chatbot for Intern Queries

## 🎯 Project Overview
- **Project:** GenAI Chatbot for Internee.pk interns
- **Goal:** 24/7 AI chatbot answering FAQs, task guidelines, policies in English + Urdu/Roman Urdu
- **Stack:** Flask + OpenCode API + SQLite + Rasa (optional later)
- **Deployment:** Render free tier + UptimeRobot
- **Status:** Phase 1 ✅ | Phase 2 in progress

## 🏗️ Architecture Decisions
| Decision | Value | Why |
|---|---|---|
| **NLU** | OpenCode LLM + keyword matcher | Rasa later if needed |
| **LLM** | OpenCode free API | OpenAI-compatible, free tier |
| **Backend** | Flask (no Celery/Redis) | Simpler, runs on Render free |
| **Database** | SQLite | Survives restarts, no external service |
| **Sessions** | SQLite | Persist across restarts |
| **Hot-reload KB** | Instant atomic swap | |
| **Deployment** | Render free + UptimeRobot | 100% free, always-on |

## 📋 Spec Decisions (CLARIFY)
- All 19 intents from spec
- Platforms: Web widget + Telegram + WhatsApp (all MVP)
- Hot-reload: Instant atomic swap
- API fallback: Simple "try again" message
- Sessions: SQLite (persists restarts)
- NLU: OpenCode LLM + keyword matcher. Rasa later

## ✅ Phase 1 Complete
- [x] Flask app factory + config + blueprints
- [x] OpenCode API client (with streaming)
- [x] Roman Urdu normalizer + language detector
- [x] SQLite session manager
- [x] Knowledge base (JSON + 3-tier retrieval + hot-reload)
- [x] RAG engine
- [x] Web widget (dark theme, robot mascot, quick actions)
- [x] Telegram integration
- [x] Rate limiter
- [x] All 13 MVP acceptance criteria passing

## 🔄 Phase 2 Remaining
| ID | Feature | Status |
|---|---|---|
| AC14 | **WhatsApp** | ⏰ Paused — needs Meta Business app |
| AC15 | Context across follow-ups | ✅ Done |
| AC16 | KB hot-reload | ✅ Done |
| AC17 | Semantic cache | ✅ Done |
| AC18 | Analytics dashboard | ✅ Done |
| AC19 | Streaming responses | ✅ Done |

## 🚧 WhatsApp (Paused)
- Code: `app/integrations/whatsapp.py` — webhook routes ready
- Need: Meta Business app → Phone Number ID + Access Token
- **⏰ REMINDER:** Complete at the end before deployment

## 🎨 UI Design
- Robot mascot: `app/static/robot.png` (from `image.png`)
- Landing: robot + "YOUR CUSTOM AI ASSISTANT" + "Get Started"
- Chat: circular robot avatar on left, user bubbles on right
- Quick actions: "FAQs", "Customer Support", "General Inquiry"
- Hero image: 80% width, 70vh, centered at 30%

## 🚀 Deployment
- **Target:** Render free tier
- **Keep-alive:** UptimeRobot (pings every 5 min)
- **No external services needed**
