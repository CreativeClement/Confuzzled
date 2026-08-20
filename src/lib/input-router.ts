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
    description: "What this actually means.",
  },
  {
    value: "step_by_step",
    label: "Step-by-Step",
    description: "Do this, then this — in order.",
  },
  {
    value: "feynman",
    label: "Feynman",
    description: "Plain English. No jargon.",
  },
  {
    value: "socratic",
    label: "Socratic",
    description: "Questions that unstick you.",
  },
  {
    value: "visual",
    label: "Visual",
    description: "See how the pieces connect.",
  },
  {
    value: "flashcards",
    label: "Flashcards",
    description: "Remember the bits that matter.",
  },
] as const;

export const OUTPUT_MODES: readonly OutputMode[] = OUTPUT_MODE_OPTIONS.map(
  (option) => option.value,
);

const VIDEO_EXTENSIONS = /\.(mp4|webm|mov|m4v|avi|mkv)(\?|#|$)/i;
const AUDIO_EXTENSIONS = /\.(mp3|wav|m4a|aac|ogg|flac)(\?|#|$)/i;
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|avif|bmp)(\?|#|$)/i;
const PDF_EXTENSION = /\.pdf(\?|#|$)/i;
const HTTP_OR_HTML =
  /https?:\/\/[^\s<>"']+|<\/?[a-z][\s\S]*>|<!doctype\s+html/i;

export function isOutputMode(value: string): value is OutputMode {
  return (OUTPUT_MODES as readonly string[]).includes(value);
}

export function detectInputType(content: string): InputType {
  const value = content.trim();
  if (!value) {
    return "text";
  }

  if (value.startsWith("%PDF") || PDF_EXTENSION.test(value) || /\[\[input:pdf\]\]/i.test(value)) {
    return "pdf";
  }

  if (VIDEO_EXTENSIONS.test(value) || /\[\[input:video\]\]/i.test(value)) {
    return "video";
  }

  if (AUDIO_EXTENSIONS.test(value) || /\[\[input:audio\]\]/i.test(value)) {
    return "audio";
  }

  if (
    IMAGE_EXTENSIONS.test(value) ||
    /^data:image\//i.test(value) ||
    /\[\[input:image\]\]/i.test(value)
  ) {
    return "image";
  }

  if (HTTP_OR_HTML.test(value)) {
    return "url";
  }

  return "text";
}

const INPUT_TYPE_CONTEXT: Record<InputType, string> = {
  text: "INPUT TYPE: text. Treat the pasted body as the source of truth.",
  pdf: "INPUT TYPE: pdf. Work only from the provided extract, %PDF marker, or filename. Do not invent pages.",
  url: "INPUT TYPE: url. The source is a web page or HTML. Use the URL and any extract. Do not pretend you fetched a live page unless the extract is present.",
  video: "INPUT TYPE: video. Use the file, URL, transcript, or notes. Do not invent timestamps.",
  audio: "INPUT TYPE: audio. A transcript may have been produced from a recording. Use that transcript. Do not invent spoken lines.",
  image:
    "INPUT TYPE: image. A photograph may be attached as pixels. Transcribe visible text and labels faithfully. If a word, voltage, dosage, or serial is unreadable, say you cannot read it. Do not fabricate unseen details.",
};

const MODE_RULES: Record<OutputMode, string> = {
  tl_dr:
    "MODE: tl_dr. Reply with exactly 1 sentence, maximum 15 words, plain English. No preamble, no list, no quotes.",
  step_by_step:
    "MODE: step_by_step. Reply with numbered steps a confused person can follow. Each step must include tools, conditions, and safety notes when the source implies them. Stay faithful; do not invent procedure. Prefer JSON {\"steps\":[{\"title\":\"string\",\"detail\":\"string\"}]} so parsers can read it; put tools, conditions, and safety inside detail.",
  feynman:
    "MODE: feynman. Teach a smart 12-year-old. Use 1-2 analogies. Strip jargon. Respect the reader. Prefer JSON {\"analogy\":\"string\",\"explanation\":\"string\"} with both analogies in analogy and the plain teaching in explanation.",
  socratic:
    "MODE: socratic. Ask exactly 3 probing questions, each with a brief hint. Prefer JSON {\"items\":[{\"question\":\"string\",\"answer\":\"string\"}]} with exactly 3 objects; put the hint in answer. No extra questions.",
  visual:
    "MODE: visual. Return valid Mermaid.js flowchart ONLY. Use graph TD; syntax. No prose, no markdown fences, no other diagram types, no click handlers.",
  flashcards:
    "MODE: flashcards. Return ONLY a JSON array of {\"front\":\"string\",\"back\":\"string\"}. Maximum 5 pairs. No wrapper object, no markdown fences, no extra keys.",
};

export function buildSystemPrompt(mode: OutputMode, inputType: InputType): string {
  return [
    "You are Confuzzle. People come to you confuzzled about something they are doing — a form, a trade, a manual, a letter, not homework only. Decipher their source into a version they can follow so they are no longer confuzzled.",
    "Keep the source honest. Never invent quotes, numbers, or steps.",
    "If the material is safety-critical (electrical, medical, legal, structural, gas, heights), stay strictly faithful and note when a qualified professional should verify.",
    "Match the output contract exactly. Parsers will consume your reply.",
    INPUT_TYPE_CONTEXT[inputType],
    MODE_RULES[mode],
  ].join("\n");
}
