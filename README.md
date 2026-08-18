# Confuzzled

A universal AI clarity engine. Paste dense text, a URL, or messy notes and get a version you can actually use: TL;DR, step-by-step, Feynman, Socratic, a visual map, or flashcards.

## Stack

- Next.js 14 App Router + TypeScript
- Tailwind CSS + shadcn/ui
- `@ai-sdk/openai` + `ai` (`gpt-4o-mini`)
- Lucide React
- Mermaid for visual mode

## Setup

```bash
npm install
cp .env.example .env.local
```

Set `OPENAI_API_KEY` in `.env.local`. Optionally set `NEXT_PUBLIC_SITE_URL` for Open Graph URLs.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Paste a paragraph, pick a mode, and click **Generate**.

## Verify

```bash
npm run typecheck
npm run lint
npm run build
```

`POST /api/clarify` expects `{ "content": string, "mode": "tl_dr" | "step_by_step" | "feynman" | "socratic" | "visual" | "flashcards" }`. Inputs are truncated at 4,000 characters. Completions cap at 1,000 output tokens.

## Lighthouse targets

| Category        | Target |
|-----------------|--------|
| Performance     | 90+    |
| Accessibility   | 100    |
| Best Practices  | 100    |
| SEO             | 100    |
