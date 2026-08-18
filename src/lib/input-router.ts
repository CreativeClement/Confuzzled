export type InputType = "text" | "pdf" | "url" | "video" | "audio" | "image";

export type OutputMode =
  | "tl_dr"
  | "step_by_step"
  | "feynman"
  | "socratic"
  | "visual"
  | "flashcards";

export const OUTPUT_MODE_OPTIONS: readonly {
  value: OutputMode;
  label: string;
  description: string;
}[] = [
  {
    value: "tl_dr",
    label: "TL;DR",
    description: "The point, in a few sentences.",
  },
  {
    value: "step_by_step",
    label: "Step-by-Step",
    description: "A numbered path through the idea.",
  },
  {
    value: "feynman",
    label: "Feynman",
    description: "Explain it like I’m twelve.",
  },
  {
    value: "socratic",
    label: "Socratic",
    description: "Questions that make it click.",
  },
  {
    value: "visual",
    label: "Visual",
    description: "A diagram of how the pieces fit.",
  },
  {
    value: "flashcards",
    label: "Flashcards",
    description: "Atomic prompts for recall.",
  },
] as const;

export const OUTPUT_MODES: readonly OutputMode[] = OUTPUT_MODE_OPTIONS.map(
  (option) => option.value,
);

const VIDEO_HOST =
  /(youtube\.com|youtu\.be|vimeo\.com|loom\.com|tiktok\.com|twitch\.tv)/i;
const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

function firstUrl(content: string): string | null {
  const match = content.match(URL_PATTERN);
  return match?.[0] ?? null;
}

export function isOutputMode(value: string): value is OutputMode {
  return (OUTPUT_MODES as readonly string[]).includes(value);
}

export function detectInputType(content: string): InputType {
  const value = content.trim();
  if (!value) {
    return "text";
  }

  if (value.startsWith("%PDF-") || /\[\[input:pdf\]\]/i.test(value)) {
    return "pdf";
  }
  if (/^data:image\//i.test(value) || /\[\[input:image\]\]/i.test(value)) {
    return "image";
  }
  if (/^data:audio\//i.test(value) || /\[\[input:audio\]\]/i.test(value)) {
    return "audio";
  }
  if (/^data:video\//i.test(value) || /\[\[input:video\]\]/i.test(value)) {
    return "video";
  }

  const url = firstUrl(value);
  if (url) {
    const lower = url.toLowerCase();
    if (VIDEO_HOST.test(lower) || /\.(mp4|webm|mov|m4v)(\?|$)/i.test(lower)) {
      return "video";
    }
    if (/\.(mp3|wav|m4a|aac|ogg|flac)(\?|$)/i.test(lower)) {
      return "audio";
    }
    if (/\.(png|jpe?g|gif|webp|svg|avif|bmp)(\?|$)/i.test(lower)) {
      return "image";
    }
    if (/\.pdf(\?|$)/i.test(lower)) {
      return "pdf";
    }

    const remainder = value.replace(url, "").trim();
    if (remainder.length < 24 || /^https?:\/\/\S+$/i.test(value)) {
      return "url";
    }
  }

  return "text";
}

const INPUT_TYPE_RULES: Record<InputType, string> = {
  text: "The user pasted prose, notes, or a dump of ideas. Treat the body as the source of truth. Do not invent citations.",
  pdf: "The user pointed at a PDF (upload marker, .pdf URL, or extracted text). Work only from the provided extract or filename context. If the body is thin, say what is missing instead of fabricating the paper.",
  url: "The user provided a web URL (and maybe surrounding notes). If page contents are not included, infer only from the URL, title-like text, and notes. Do not pretend you fetched the live page unless the text is clearly an extract.",
  video: "The user referenced a video (YouTube/Vimeo/Loom/file). Use the URL, title, and any transcript or notes. Do not invent timestamps or quotes that are not in the input.",
  audio: "The user referenced audio. Use any transcript, filename, or notes. Do not invent lyrics or spoken lines.",
  image: "The user referenced an image. Use alt text, captions, OCR, or descriptions in the input. Do not fabricate visual details that are not described.",
};

const MODE_RULES: Record<OutputMode, string> = {
  tl_dr: [
    "MODE: TL;DR",
    "Goal: a high-signal summary a busy reader can trust.",
    "Rules:",
    "1. Output 2 to 4 sentences of plain prose. No heading, no bullet list, no preamble (never start with 'Sure' or 'Here is').",
    "2. Sentence 1 states the core claim or topic. Sentence 2 covers the mechanism, evidence, or structure. Sentence 3 (optional) is the 'so what' or caveat.",
    "3. Prefer concrete nouns over adjectives. Keep numbers, names, and constraints from the source.",
    "4. Do not add facts that are not in the input. If the input is ambiguous, say so in one clause.",
    "5. Return plain text only — not JSON, not markdown fences.",
  ].join("\n"),
  step_by_step: [
    "MODE: STEP-BY-STEP",
    "Goal: a pedagogical sequence the reader can follow without rereading the source.",
    "Rules:",
    "1. Return ONLY valid JSON of the shape: {\"steps\":[{\"title\":\"string\",\"detail\":\"string\"}]}",
    "2. Produce 4 to 8 steps. Each title is 3 to 8 words, imperative or nominative, no trailing period.",
    "3. Each detail is 1 to 3 sentences that explain that step only. Do not preview later steps.",
    "4. Order is the order a learner should take, which may differ from the source's order.",
    "5. No markdown, no code fences, no extra keys.",
  ].join("\n"),
  feynman: [
    "MODE: FEYNMAN",
    "Goal: a 12-year-old could retell this at dinner without jargon.",
    "Rules:",
    "1. Return ONLY valid JSON of the shape: {\"analogy\":\"string\",\"explanation\":\"string\"}",
    "2. analogy: one everyday comparison (kitchen, playground, traffic, games). One or two sentences. No 'Imagine if' stacking.",
    "3. explanation: 3 to 6 short sentences in plain words. If a technical term is unavoidable, define it in the same sentence in parentheses.",
    "4. No condescension, no baby-talk, no emojis. Do not say 'simply' or 'just'.",
    "5. No markdown, no code fences, no extra keys.",
  ].join("\n"),
  socratic: [
    "MODE: SOCRATIC",
    "Goal: a short dialogue that leads the learner to the insight instead of lecturing.",
    "Rules:",
    "1. Return ONLY valid JSON of the shape: {\"items\":[{\"question\":\"string\",\"answer\":\"string\"}]}",
    "2. Produce 4 to 6 pairs. Questions progress from a concrete observation to the structural 'why'.",
    "3. Each question is one sentence, second person or open ('What happens if…'). No yes/no unless followed by 'why'.",
    "4. Each answer is 1 to 3 sentences, teaching the next rung, not dumping the whole topic.",
    "5. No markdown, no code fences, no extra keys.",
  ].join("\n"),
  visual: [
    "MODE: VISUAL",
    "Goal: a Mermaid diagram that maps relationships in the input.",
    "Rules:",
    "1. Return ONLY a Mermaid definition. Preferred start: flowchart TD  (mindmap is allowed if the source is hierarchical).",
    "2. Node IDs are ASCII letters and numbers (A, B1). Labels are quoted and under 40 characters.",
    "3. Show 5 to 14 nodes. Edges need labels when the relationship is not obvious.",
    "4. Do not wrap in markdown fences unless required to keep the parser valid. No prose before or after the diagram.",
    "5. Never emit HTML, scripts, or click handlers. Do not use Mermaid callbacks.",
  ].join("\n"),
  flashcards: [
    "MODE: FLASHCARDS",
    "Goal: atomic recall cards for spaced practice.",
    "Rules:",
    "1. Return ONLY valid JSON of the shape: {\"cards\":[{\"front\":\"string\",\"back\":\"string\"}]}",
    "2. Produce 5 to 10 cards. Each card teaches one fact, term, or distinction.",
    "3. front is a prompt or term (question or word). back is the answer, 1 to 3 sentences, no extra trivia.",
    "4. Do not duplicate cards. Prefer source-specific names over generic definitions.",
    "5. No markdown, no code fences, no extra keys.",
  ].join("\n"),
};

export function buildSystemPrompt(mode: OutputMode, inputType: InputType): string {
  return [
    "You are Confuzzled, a universal AI clarity engine.",
    "Your job is to unconfuzzle the user's material: keep it faithful, denser in insight, and easier to hold.",
    "Never invent sources, quotes, numbers, or steps that are not grounded in the input.",
    "If the input is too thin to be sure, say what is missing and still help with what is present.",
    "Match the requested output contract exactly — parsers will consume your reply.",
    "",
    `INPUT TYPE: ${inputType}`,
    INPUT_TYPE_RULES[inputType],
    "",
    MODE_RULES[mode],
  ].join("\n");
}
