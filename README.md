# Confuzzled

A clarity engine for **anyone who is confused** — not just students. Paste instructions, a spec, a wiring note, a form, a manual, a messy email, a URL, a PDF, or a photo, and get a version you can actually follow: TL;DR, step-by-step, plain English, Socratic Q&A, a visual map, or flashcards.

Electricians, parents, first-timers, professionals, kids, experts: if you’re stuck, this is for you.

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- `@ai-sdk/openai` + `ai` (`gpt-4o-mini`, including vision for photos)
- Lucide React
- Mermaid for visual mode

## Setup

```bash
npm install
cp .env.example .env.local
```

Set `OPENAI_API_KEY` in `.env.local`. Optionally set `NEXT_PUBLIC_SITE_URL` for Open Graph and sitemap URLs.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Paste the confusing thing and click **Unconfuzzle this** (or ⌘/Ctrl+Enter). Confuzzled picks a lens; you can switch after. The clear version **streams in**. Paste a public URL to fetch the page, upload a PDF to extract text, attach a **photo** to read visible words (the photo stays in this browser with that clarification), or **Try a sample** with no API key. A draft of the box is saved in this browser. On a phone, add Confuzzled to your home screen.

## Workspace

Clarifications, ratings, photos, and your display name live in **this browser** (`localStorage` plus IndexedDB for photos). Open **Dashboard** to browse history, pin keepers, rename titles, set a preferred lens, and export a JSON backup. Photos are not inside the JSON export. Open any item with **Unconfuzzle** to resume it on the homepage. There is no cloud account yet — do not put secrets in the source you paste if this device is shared.

## Honesty

We stay faithful to your source. Safety-critical domains get a caution strip. Public `http(s)` URLs are fetched with SSRF guards. Photos are sent as pixels so visible text can be read; blurry labels stay unread. See `/honesty`.

## Verify

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

CI runs the same checks on every pull request.

`POST /api/clarify` expects `{ "content": string, "mode"?: "auto" | "tl_dr" | "step_by_step" | "feynman" | "socratic" | "visual" | "flashcards", "role"?: string, "stream"?: boolean, "focus"?: { "step": number, "text": string }, "image"?: { "mime": "image/jpeg" | "image/png" | "image/webp" | "image/gif", "data": "<base64>" } }`. `mode` defaults to `auto`. `stream: true` returns Server-Sent Events (`meta`, `delta`, `retry`, `done` / `error`). Public `http(s)` URLs are fetched with SSRF guards. Photos use vision. Structured replies that fail to parse are retried once. Responses may include `citations` (phrases that appear in both source and result), `fetched`, and `seen`. `POST /api/extract` accepts a PDF file and returns selectable text. `GET /api/health` reports whether OpenAI is configured (not whether it has quota). Inputs are truncated at 4,000 characters. Completions cap at 1,000 output tokens.

## Lighthouse (measured)

Production build, homepage, headless Chrome on this machine:

| Category        | Score |
|-----------------|-------|
| Performance     | 98    |
| Accessibility   | 100   |
| Best Practices  | 100   |
| SEO             | 100   |
