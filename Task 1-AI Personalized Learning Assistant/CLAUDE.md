# 🏛️ AI Personalized Learning Assistant — Project Constitution

> **Mission:** Build an intelligent, adaptive learning platform powered by Generative AI that personalizes educational content, tracks progress, and provides interactive tutoring.

---

## I. Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict mode) |
| Framework | Next.js 14 (App Router) |
| UI | Tailwind CSS + Custom Components |
| Auth | Firebase Authentication (email/password + Google OAuth) |
| Database | Firestore (NoSQL) |
| Storage | Firebase Storage |
| AI | DeepSeek v4 via OpenCode Zen API |
| Deployment | Vercel |

## II. Architecture

- **Next.js 14 App Router** with server components and API routes
- **Firebase Auth** for user authentication (email/password + Google)
- **Firestore** for storing user progress, lessons, and chat history
- **Firebase Storage** for generated assets
- **DeepSeek v4** via OpenAI-compatible SDK for all AI features
- API routes under `/src/app/api/` for AI-powered endpoints (chat, lesson generation, progress analysis)

## III. Key Features

1. **Personalized Learning Paths** — AI generates custom lesson plans based on skill gaps
2. **Interactive AI Tutor** — Chat-based tutoring with context-aware responses
3. **Progress Tracking** — Visual analytics of learning metrics
4. **Adaptive Quizzes** — AI-generated assessments that adapt to user performance
5. **Content Generation** — On-demand lesson creation tailored to user interests
