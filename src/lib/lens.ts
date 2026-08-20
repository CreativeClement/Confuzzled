import { OUTPUT_MODES, isOutputMode, type OutputMode } from "@/lib/input-router";

const PROCEDURE =
  /\b(step|first|then|next|after that|install|assemble|reset|unplug|tighten|wire|wiring|breaker|recipe|instructions?|procedure|before you|how to|do this)\b/i;
const CONCEPT =
  /\b(means|why|concept|theory|explain|what is|what are|in other words|basically)\b/i;
const CONFUSED =
  /\b(i don'?t (get|understand)|confused|what does this mean|i'?m lost|still stuck)\b/i;
const VISUAL =
  /\b(architecture|flowchart|diagram|depends on|relationship|pipeline|system map|connects? to)\b/i;
const DRILL =
  /\b(memorize|terms?|vocab|flashcard|exam|quiz|remember these)\b/i;
const LETTER =
  /\b(dear |to whom|policy|hereby|please find|insurance|notice of|enclosed)\b/i;

function countMatches(source: string, pattern: RegExp): number {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const global = new RegExp(pattern.source, flags);
  return source.match(global)?.length ?? 0;
}

export function recommendOutputMode(content: string, bias?: OutputMode): OutputMode {
  const text = content.trim();
  if (!text) {
    return bias && isOutputMode(bias) ? bias : "tl_dr";
  }

  const scores: Record<OutputMode, number> = {
    tl_dr: 1,
    step_by_step: 0,
    feynman: 0,
    socratic: 0,
    visual: 0,
    flashcards: 0,
  };

  if (PROCEDURE.test(text)) {
    scores.step_by_step += 4;
  }
  if (/^\s*\d+[\.)]/m.test(text)) {
    scores.step_by_step += 3;
  }

  if (CONCEPT.test(text)) {
    scores.feynman += 4;
  }
  if (text.length > 900 && scores.step_by_step < 3) {
    scores.feynman += 1;
  }

  if (CONFUSED.test(text)) {
    scores.socratic += 3;
  }
  if (countMatches(text, /\?/g) >= 2) {
    scores.socratic += 3;
  }

  if (VISUAL.test(text)) {
    scores.visual += 4;
  }
  if (DRILL.test(text)) {
    scores.flashcards += 4;
  }
  if (LETTER.test(text)) {
    scores.tl_dr += 3;
  }
  if (text.length < 220) {
    scores.tl_dr += 2;
  }

  let winner: OutputMode = "tl_dr";
  let best = Number.NEGATIVE_INFINITY;
  let second = Number.NEGATIVE_INFINITY;
  for (const mode of OUTPUT_MODES) {
    const score = scores[mode];
    if (score > best) {
      second = best;
      best = score;
      winner = mode;
    } else if (score > second) {
      second = score;
    }
  }

  const ambiguous = best - second < 2;
  if (ambiguous && bias && isOutputMode(bias)) {
    return bias;
  }
  return winner;
}

export function buildFocusPrompt(source: string, step: number, text: string): string {
  return [
    source.trim(),
    "---",
    `The reader is stuck on step ${step}: ${text.trim()}`,
    "Explain only that step in plain English. Stay faithful to the source. If a number, tool, or rating is not in the source, say you cannot tell from the source. Do not invent procedure.",
  ].join("\n\n");
}
