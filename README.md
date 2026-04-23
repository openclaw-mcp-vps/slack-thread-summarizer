# Slack Thread Summarizer

Production-ready Next.js 15 App Router app that installs a Slack bot, summarizes long threads with OpenAI, and unlocks the paid dashboard after Stripe checkout via secure cookie.

## Local setup

1. Copy `.env.example` to `.env.local` and fill keys.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

## Stripe checkout unlock flow

Set your Stripe Payment Link **success URL** to:

`https://your-domain.com/unlock?session_id={CHECKOUT_SESSION_ID}`

That redirect will verify payment and issue the paywall cookie for dashboard access.

## Key endpoints

- `GET /api/health`
- `GET /api/slack/install`
- `GET /api/slack/oauth`
- `POST /api/slack/events`
- `POST /api/summarize`
- `POST /api/webhooks/stripe`
- `GET /api/paywall/unlock?session_id=...`

## Storage

This project persists installs, usage, and paid sessions in `data/store.json`.
