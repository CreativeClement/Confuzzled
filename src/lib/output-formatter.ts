import type { OutputMode } from "@/lib/input-router";

export type FlashcardItem = {
  front: string;
  back: string;
};

export type StepItem = {
  step: number;
  text: string;
};

export type SocraticItem = {
  question: string;
  hint: string;
};

export type MermaidOutput = {
  type: "mermaid";
  code: string;
};

export type TextOutput = {
  type: "text";
  content: string;
};

export type FormattedOutput =
  | FlashcardItem[]
  | StepItem[]
  | SocraticItem[]
  | MermaidOutput
  | TextOutput;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function nonemptyLines(raw: string): string[] {
  return raw
    .split(/\n+/)
    .map((line) => line.replace(/^\s*\d+[\.)]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

function stripFences(raw: string): string {
  return raw
    .replace(/^\s*```(?:json|mermaid|txt|text)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function parseJson(raw: string): unknown | null {
  const candidates = [raw.trim(), stripFences(raw)];
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

function toFlashcards(value: unknown): FlashcardItem[] {
  const record = asRecord(value);
  const list = Array.isArray(value)
    ? value
    : Array.isArray(record?.cards)
      ? record.cards
      : Array.isArray(record?.flashcards)
        ? record.flashcards
        : null;

  if (!list) {
    return [];
  }

  return list
    .map((item) => {
      if (typeof item === "string") {
        const [front, ...rest] = item.split("::");
        return { front: (front ?? item).trim(), back: rest.join("::").trim() };
      }
      const row = asRecord(item);
      if (!row) {
        return null;
      }
      const front = asString(row.front) ?? asString(row.q) ?? asString(row.term);
      const back = asString(row.back) ?? asString(row.a) ?? asString(row.hint) ?? "";
      if (!front) {
        return null;
      }
      return { front: front.trim(), back: back.trim() };
    })
    .filter((item): item is FlashcardItem => item !== null);
}

function toSteps(raw: string): StepItem[] {
  const parsed = parseJson(raw);
  const record = asRecord(parsed);
  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(record?.steps)
      ? record.steps
      : null;

  if (list && list.length > 0) {
    const items = list
      .map((item, index) => {
        if (typeof item === "string") {
          return { step: index + 1, text: item.trim() };
        }
        const row = asRecord(item);
        if (!row) {
          return null;
        }
        const text =
          asString(row.text) ??
          [asString(row.title), asString(row.detail)].filter(Boolean).join(" — ");
        if (!text.trim()) {
          return null;
        }
        const stepNumber = typeof row.step === "number" ? row.step : index + 1;
        return { step: stepNumber, text: text.trim() };
      })
      .filter((item): item is StepItem => item !== null);
    if (items.length > 0) {
      return items;
    }
  }

  return nonemptyLines(raw).map((text, index) => ({
    step: index + 1,
    text,
  }));
}

function toFeynmanText(raw: string): TextOutput {
  const parsed = parseJson(raw);
  const record = asRecord(parsed);
  const analogy = asString(record?.analogy)?.trim();
  const explanation = asString(record?.explanation)?.trim();
  if (analogy && explanation) {
    return textOutput(`${analogy}\n\n${explanation}`);
  }
  return textOutput(raw);
}

function toSocratic(raw: string): SocraticItem[] {
  const lines = nonemptyLines(raw);
  if (lines.length >= 2 && lines.length % 2 === 0) {
    const items: SocraticItem[] = [];
    for (let index = 0; index < lines.length; index += 2) {
      const question = lines[index];
      const hint = lines[index + 1];
      if (question) {
        items.push({ question, hint: hint ?? "" });
      }
    }
    return items;
  }

  return lines.map((line) => {
    const hintSplit = line.split(/\s+[—:-]\s+|Hint:\s*/i);
    const question = hintSplit[0]?.trim() ?? line;
    const hint = hintSplit.slice(1).join(" ").trim();
    return { question, hint };
  });
}

function textOutput(raw: string): TextOutput {
  return { type: "text", content: (raw ?? "").trim() };
}

export function formatOutput(raw: string, mode: OutputMode): FormattedOutput {
  const source = raw ?? "";

  try {
    if (mode === "flashcards") {
      const parsed = parseJson(source);
      if (parsed == null) {
        return [];
      }
      return toFlashcards(parsed);
    }

    if (mode === "visual") {
      return { type: "mermaid", code: source.trim() };
    }

    if (mode === "step_by_step") {
      return toSteps(source);
    }

    if (mode === "feynman") {
      return toFeynmanText(source);
    }

    if (mode === "socratic") {
      const parsed = parseJson(source);
      const record = asRecord(parsed);
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray(record?.items)
          ? record.items
          : null;

      if (list && list.length > 0) {
        const items = list
          .map((item) => {
            if (typeof item === "string") {
              return { question: item, hint: "" };
            }
            const row = asRecord(item);
            if (!row) {
              return null;
            }
            const question = asString(row.question) ?? asString(row.q);
            const hint = asString(row.hint) ?? asString(row.answer) ?? asString(row.a) ?? "";
            if (!question) {
              return null;
            }
            return { question: question.trim(), hint: hint.trim() };
          })
          .filter((item): item is SocraticItem => item !== null);
        if (items.length > 0) {
          return items;
        }
      }

      return toSocratic(source);
    }

    return textOutput(source);
  } catch {
    if (mode === "flashcards") {
      return [];
    }
    if (mode === "visual") {
      return { type: "mermaid", code: source.trim() };
    }
    if (mode === "step_by_step" || mode === "socratic") {
      return [];
    }
    return textOutput(source);
  }
}

export function isMermaidOutput(value: FormattedOutput): value is MermaidOutput {
  return typeof value === "object" && value !== null && !Array.isArray(value) && value.type === "mermaid";
}

export function isTextOutput(value: FormattedOutput): value is TextOutput {
  return typeof value === "object" && value !== null && !Array.isArray(value) && value.type === "text";
}

export function isFlashcardList(value: FormattedOutput): value is FlashcardItem[] {
  return Array.isArray(value) && value.every((item) => "front" in item && "back" in item);
}

export function isStepList(value: FormattedOutput): value is StepItem[] {
  return Array.isArray(value) && value.every((item) => "step" in item && "text" in item);
}

export function isSocraticList(value: FormattedOutput): value is SocraticItem[] {
  return Array.isArray(value) && value.every((item) => "question" in item && "hint" in item);
}

export function isThinOutput(value: FormattedOutput, mode: OutputMode): boolean {
  if (mode === "flashcards") {
    return !isFlashcardList(value) || value.length === 0;
  }
  if (mode === "step_by_step") {
    return !isStepList(value) || value.length === 0;
  }
  if (mode === "socratic") {
    return !isSocraticList(value) || value.length === 0;
  }
  if (mode === "visual") {
    return !isMermaidOutput(value) || !/\bgraph\s+TD\b/i.test(value.code);
  }
  if (isTextOutput(value)) {
    return value.content.trim().length < 8;
  }
  return true;
}

export function formattedOutputToPlainText(value: FormattedOutput, mode: OutputMode): string {
  if (isMermaidOutput(value)) {
    return value.code;
  }
  if (isTextOutput(value)) {
    return value.content;
  }
  if (mode === "flashcards" && isFlashcardList(value)) {
    return value
      .map((card, index) => `Card ${index + 1}\nFront: ${card.front}\nBack: ${card.back}`)
      .join("\n\n");
  }
  if (mode === "step_by_step" && isStepList(value)) {
    return value.map((item) => `${item.step}. ${item.text}`).join("\n");
  }
  if (mode === "socratic" && isSocraticList(value)) {
    return value
      .map((item, index) => `Q${index + 1}: ${item.question}\nHint: ${item.hint}`.trim())
      .join("\n\n");
  }
  return "";
}
