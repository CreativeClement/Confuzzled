import type { OutputMode } from "@/lib/input-router";

export type TlDrOutput = {
  type: "tl_dr";
  summary: string;
};

export type StepByStepOutput = {
  type: "step_by_step";
  steps: { title: string; detail: string }[];
};

export type FeynmanOutput = {
  type: "feynman";
  analogy: string;
  explanation: string;
};

export type SocraticOutput = {
  type: "socratic";
  items: { question: string; answer: string }[];
};

export type VisualOutput = {
  type: "visual";
  mermaid: string;
};

export type FlashcardsOutput = {
  type: "flashcards";
  cards: { front: string; back: string }[];
};

export type RawOutput = {
  type: "raw";
  text: string;
};

export type FormattedOutput =
  | TlDrOutput
  | StepByStepOutput
  | FeynmanOutput
  | SocraticOutput
  | VisualOutput
  | FlashcardsOutput
  | RawOutput;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function stripFences(raw: string): string {
  return raw
    .replace(/^\s*```(?:json|mermaid|txt|text)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}

function extractFenced(raw: string, language?: string): string | null {
  const pattern = language
    ? new RegExp("```" + language + "\\s*([\\s\\S]*?)```", "i")
    : /```(?:json|mermaid)?\s*([\s\S]*?)```/i;
  const match = raw.match(pattern);
  const inner = match?.[1]?.trim();
  return inner ? inner : null;
}

function extractJson(raw: string): unknown | null {
  const trimmed = raw.trim();
  const candidates = [trimmed, extractFenced(trimmed, "json"), extractFenced(trimmed)]
    .filter((item): item is string => Boolean(item))
    .map((item) => stripFences(item));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      /* try the next candidate */
    }
  }

  const start = trimmed.search(/[\[{]/);
  if (start < 0) {
    return null;
  }

  const opener = trimmed[start];
  const closer = opener === "[" ? "]" : "}";
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let index = start; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === "\\") {
        escape = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }
    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === opener) {
      depth += 1;
    } else if (char === closer) {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(trimmed.slice(start, index + 1));
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

function splitNumbered(raw: string): { title: string; detail: string }[] {
  const lines = raw
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const steps: { title: string; detail: string }[] = [];
  let current: { title: string; detail: string } | null = null;

  for (const line of lines) {
    const numbered = line.match(/^(?:\d+[\.)]|[-*])\s+(.*)$/);
    if (numbered?.[1]) {
      if (current) {
        steps.push(current);
      }
      const body = numbered[1];
      const [title, ...rest] = body.split(/[:—-]\s+/);
      current = {
        title: (title ?? body).trim(),
        detail: rest.join(" ").trim(),
      };
      continue;
    }
    if (current) {
      current.detail = [current.detail, line].filter(Boolean).join(" ");
    }
  }

  if (current) {
    steps.push(current);
  }

  return steps.filter((step) => step.title.length > 0);
}

function parseSteps(raw: string): StepByStepOutput {
  const json = extractJson(raw);
  const record = asRecord(json);
  const list = Array.isArray(json)
    ? json
    : Array.isArray(record?.steps)
      ? record.steps
      : null;

  if (list) {
    const steps = list
      .map((item) => {
        if (typeof item === "string") {
          return { title: item, detail: "" };
        }
        const row = asRecord(item);
        if (!row) {
          return null;
        }
        const title = asString(row.title) ?? asString(row.step) ?? asString(row.heading);
        const detail = asString(row.detail) ?? asString(row.body) ?? asString(row.description) ?? "";
        if (!title) {
          return null;
        }
        return { title: title.trim(), detail: detail.trim() };
      })
      .filter((item): item is { title: string; detail: string } => item !== null);

    if (steps.length > 0) {
      return { type: "step_by_step", steps };
    }
  }

  const fallback = splitNumbered(raw);
  if (fallback.length > 0) {
    return { type: "step_by_step", steps: fallback };
  }

  return {
    type: "step_by_step",
    steps: [{ title: "Overview", detail: raw.trim() }],
  };
}

function parseFeynman(raw: string): FeynmanOutput {
  const record = asRecord(extractJson(raw));
  if (record) {
    const analogy = asString(record.analogy) ?? asString(record.metaphor) ?? "";
    const explanation =
      asString(record.explanation) ?? asString(record.body) ?? asString(record.text) ?? "";
    if (analogy || explanation) {
      return {
        type: "feynman",
        analogy: analogy.trim(),
        explanation: (explanation || raw).trim(),
      };
    }
  }

  const paragraphs = raw
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length >= 2) {
    return {
      type: "feynman",
      analogy: paragraphs[0] ?? "",
      explanation: paragraphs.slice(1).join("\n\n"),
    };
  }

  return { type: "feynman", analogy: "", explanation: raw.trim() };
}

function parseSocratic(raw: string): SocraticOutput {
  const json = extractJson(raw);
  const record = asRecord(json);
  const list = Array.isArray(json)
    ? json
    : Array.isArray(record?.items)
      ? record.items
      : Array.isArray(record?.qa)
        ? record.qa
        : Array.isArray(record?.questions)
          ? record.questions
          : null;

  if (list) {
    const items = list
      .map((item) => {
        if (typeof item === "string") {
          return { question: item, answer: "" };
        }
        const row = asRecord(item);
        if (!row) {
          return null;
        }
        const question = asString(row.question) ?? asString(row.q) ?? asString(row.prompt);
        const answer = asString(row.answer) ?? asString(row.a) ?? asString(row.response) ?? "";
        if (!question) {
          return null;
        }
        return { question: question.trim(), answer: answer.trim() };
      })
      .filter((item): item is { question: string; answer: string } => item !== null);

    if (items.length > 0) {
      return { type: "socratic", items };
    }
  }

  const pairs: { question: string; answer: string }[] = [];
  const blocks = raw.split(/(?=^Q(?:uestion)?\s*[:.)])/gim);
  for (const block of blocks) {
    const questionMatch = block.match(/Q(?:uestion)?\s*[:.)]\s*([\s\S]*?)(?=A(?:nswer)?\s*[:.)]|$)/i);
    const answerMatch = block.match(/A(?:nswer)?\s*[:.)]\s*([\s\S]*)$/i);
    const question = questionMatch?.[1]?.trim();
    if (question) {
      pairs.push({
        question,
        answer: answerMatch?.[1]?.trim() ?? "",
      });
    }
  }

  if (pairs.length > 0) {
    return { type: "socratic", items: pairs };
  }

  return {
    type: "socratic",
    items: [{ question: "What is the core idea?", answer: raw.trim() }],
  };
}

function looksLikeMermaid(value: string): boolean {
  return /^(flowchart|graph|sequenceDiagram|classDiagram|mindmap|erDiagram|journey|gantt|pie|stateDiagram|gitGraph)\b/m.test(
    value.trim(),
  );
}

function parseVisual(raw: string): VisualOutput {
  const fenced = extractFenced(raw, "mermaid") ?? extractFenced(raw);
  const candidate = stripFences(fenced ?? raw);
  if (looksLikeMermaid(candidate)) {
    return { type: "visual", mermaid: candidate };
  }

  const escaped = raw.replace(/"/g, "#quot;").slice(0, 280);
  return {
    type: "visual",
    mermaid: `flowchart TD\n  A["${escaped || "Unable to build a diagram from this input."}"]`,
  };
}

function parseFlashcards(raw: string): FlashcardsOutput {
  const json = extractJson(raw);
  const record = asRecord(json);
  const list = Array.isArray(json)
    ? json
    : Array.isArray(record?.cards)
      ? record.cards
      : Array.isArray(record?.flashcards)
        ? record.flashcards
        : null;

  if (list) {
    const cards = list
      .map((item) => {
        if (typeof item === "string") {
          const [front, ...rest] = item.split("::");
          return { front: (front ?? item).trim(), back: rest.join("::").trim() };
        }
        const row = asRecord(item);
        if (!row) {
          return null;
        }
        const front = asString(row.front) ?? asString(row.q) ?? asString(row.term) ?? asString(row.prompt);
        const back = asString(row.back) ?? asString(row.a) ?? asString(row.definition) ?? asString(row.answer) ?? "";
        if (!front) {
          return null;
        }
        return { front: front.trim(), back: back.trim() };
      })
      .filter((item): item is { front: string; back: string } => item !== null);

    if (cards.length > 0) {
      return { type: "flashcards", cards };
    }
  }

  const fromDividers = raw
    .split(/\n\s*---\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const [front, ...rest] = block.split(/\n+/);
      return { front: (front ?? "").trim(), back: rest.join(" ").trim() };
    })
    .filter((card) => card.front.length > 0);

  if (fromDividers.length > 1) {
    return { type: "flashcards", cards: fromDividers };
  }

  return {
    type: "flashcards",
    cards: [{ front: "Key takeaway", back: raw.trim() }],
  };
}

export function formatOutput(raw: string, mode: OutputMode): FormattedOutput {
  const text = (raw ?? "").trim();
  if (!text) {
    return { type: "raw", text: "" };
  }

  try {
    switch (mode) {
      case "tl_dr": {
        const record = asRecord(extractJson(text));
        const summary =
          (record && (asString(record.summary) ?? asString(record.text) ?? asString(record.tldr))) ||
          stripFences(text);
        return { type: "tl_dr", summary };
      }
      case "step_by_step":
        return parseSteps(text);
      case "feynman":
        return parseFeynman(text);
      case "socratic":
        return parseSocratic(text);
      case "visual":
        return parseVisual(text);
      case "flashcards":
        return parseFlashcards(text);
      default:
        return { type: "raw", text };
    }
  } catch {
    return { type: "raw", text };
  }
}
