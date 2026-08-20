# Confuzzle

**Confuzzle** is for people who are confuzzled about something they are doing. Show it the problem — paste, PDF, scan, or import. It deciphers the confusion so you can keep going, and you’re no longer confuzzled.

The name is **Confuzzle**. People who need it are **confuzzled**. The button is **Confuzzle this**.

Confuzzle picks a lens: TL;DR, step-by-step, plain English, Socratic Q&A, a visual map, or flashcards. You can switch after. We do not invent safety-critical steps.

## Bring your own key

Confuzzle has no AI bill of its own. You connect a key in **Settings**, it is stored in your
browser, and each request carries it straight through to the provider you picked.

| Provider | Default model | Reads scans | Transcribes audio |
| --- | --- | --- | --- |
| OpenAI | `gpt-4o-mini` | yes | yes |
| Groq (free tier) | `llama-3.3-70b-versatile` | yes | yes |
| OpenRouter | `openai/gpt-4o-mini` | yes | no |
| Any OpenAI-compatible endpoint | you choose | depends | no |

**Try a sample** works with no key at all.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Confuzzle this** (or ⌘/Ctrl+Enter). On a
phone, add Confuzzle to your home screen.

`.env.local` is optional. Set `CONFUZZLE_API_KEY` (plus `CONFUZZLE_PROVIDER`, `CONFUZZLE_MODEL`,
`CONFUZZLE_BASE_URL`) only when you want a deployment to serve readers who have no key of their own.
Set `NEXT_PUBLIC_SITE_URL` for Open Graph, sitemap, and install URLs.

## What stays in this browser

History, ratings, drafts, photos, and your display name stay on this device. Photos live in IndexedDB and are not in the JSON export. There is no cloud account. See `/privacy` and `/honesty`.

## Verify

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm start   # then, in another terminal:
npm run smoke
```

CI runs tests, typecheck, lint, build, and smoke on every pull request.

`POST /api/clarify` — `{ content, mode?, role?, stream?, focus?, image? }`. `stream: true` returns SSE. `POST /api/extract` — PDF text. `POST /api/transcribe` — audio via Whisper. `GET /api/health` — whether OpenAI is configured (not quota).

## Lighthouse (measured)

Production homepage, headless Chrome on this machine: Performance **98**, Accessibility **100**, Best Practices **100**, SEO **100**.

## License

MIT. See `LICENSE`.
