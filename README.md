# Gnani Live Demo (Industry -> Use case -> Live Call)

## What this includes
- A production-style frontend widget (no page reloads) in `public/`
- A Node.js backend with abuse prevention and a call trigger API
- Optional Twilio dialing (or a safe "mock" mode)

## Local run
1) Install
   npm install

2) Configure
   Copy .env.example to .env
   Set CALL_PROVIDER_MODE=mock for local UI testing

3) Start
   npm run dev

4) Open
   http://localhost:3000

## Enabling real outbound calls (Twilio)
1) Set:
   CALL_PROVIDER_MODE=twilio
   TWILIO_ACCOUNT_SID
   TWILIO_AUTH_TOKEN
   TWILIO_FROM_NUMBER
   TWILIO_TWIML_URL

2) Easiest option for TWILIO_TWIML_URL
   Use this server's built-in TwiML endpoint:
   https://YOUR_DOMAIN/twiml

3) Replace /twiml
   The built-in TwiML only speaks a short message.
   For a real demo, replace it with your real voice agent integration.

## Deploy
- Deploy on any Node-friendly platform.
- Put it behind HTTPS.
- If you embed this on www.gnani.ai and host API on demos.gnani.ai, set CORS_ALLOW_ORIGINS to include https://www.gnani.ai

## Embed in your main site
Option A: iframe embed
- Host this at demos.gnani.ai
- Embed in hero with an iframe sized 720x720

Option B: native embed
- Copy `public/app.js` and `public/styles.css` into your main site build
- Keep the API endpoint reachable at /api/start-call
