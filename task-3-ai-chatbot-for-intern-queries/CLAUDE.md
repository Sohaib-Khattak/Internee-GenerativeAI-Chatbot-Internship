# Chatbot for Intern Queries — GenAI Chatbot

## Principles

- NLU-first: handle ambiguous, misspelled, and code-switched queries gracefully before adding features.
- Knowledge base as source of truth: all answers must trace back to Internee.pk's approved content.
- 24/7 reliability: every component must handle failures gracefully and never silently drop a query.
- UI-first impression: the robot mascot must be prominently displayed in both the welcome screen and chat widget for brand identity.

## Constraints

- Tooling limited to: Rasa, Dialogflow, OpenCode free API (https://opencode.ai/workspace/<YOUR-WORKSPACE-KEY>/keys), Flask. Propose before adding anything else.
- Never expose raw Internee.pk knowledge base content outside approved API boundaries.
- Must support English + Urdu code-switched queries common in Pakistani intern communication.
- Chat widget must follow dark theme with gradient accent effects. 3D robot mascot (image.png) must appear as the chatbot avatar on the left side of the chat.
- Quick action buttons ("Frequently Asked Questions", "Customer Support", "General Inquiry") must appear on first load.
- Landing/welcome screen must show the robot mascot with tagline "YOUR CUSTOM AI ASSISTANT" and a "Get Started" button.

## Definition of done

- NLU correctly interprets FAQs, task guidelines, and ambiguous queries with graceful fallback.
- All chat integrations (WhatsApp, Telegram, Web widget) tested end-to-end.
- Deployment documented so a fresh instance can be running in under 30 minutes.
- Web widget is responsive (mobile-friendly) and matches the dark theme reference images.
