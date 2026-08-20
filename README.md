# Confuzzle

**Confuzzle** is for people who are confuzzled about something they are doing. Show it the problem — paste, PDF, scan, or import. It deciphers the confusion so you can keep going, and you’re no longer confuzzled.

The name is Confuzzle. People who need it are **confuzzled**. **Unconfuzzle** is the button.

Confuzzle picks a lens: TL;DR, step-by-step, plain English, Socratic Q&A, a visual map, or flashcards. You can switch after. We do not invent safety-critical steps.

## Setup

```bash
npm install
cp .env.example .env.local
```

Set `OPENAI_API_KEY` in `.env.local`. Optionally set `NEXT_PUBLIC_SITE_URL` for Open Graph, sitemap, and install URLs.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **Unconfuzzle this** (or ⌘/Ctrl+Enter), or **Try a sample** with no API key. On a phone, add Confuzzle to your home screen.

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
