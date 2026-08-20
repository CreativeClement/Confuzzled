import { formattedOutputToPlainText, type FormattedOutput } from "@/lib/output-formatter";
import type { OutputMode } from "@/lib/input-router";

const MIN_WORDS = 4;
const MAX_WORDS = 8;
const MIN_CHARS = 18;
const MAX_CITATIONS = 6;

function normalizeSpace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function overlaps(left: string, right: string): boolean {
  const a = left.toLowerCase();
  const b = right.toLowerCase();
  return a.includes(b) || b.includes(a);
}

export function extractCitations(source: string, result: string, limit = MAX_CITATIONS): string[] {
  const src = normalizeSpace(source);
  const hay = normalizeSpace(result).toLowerCase();
  if (src.length < MIN_CHARS || hay.length < 8) {
    return [];
  }

  const words = src.split(" ");
  const found: string[] = [];

  for (let size = MAX_WORDS; size >= MIN_WORDS; size -= 1) {
    for (let index = 0; index + size <= words.length; index += 1) {
      const phrase = words.slice(index, index + size).join(" ");
      if (phrase.length < MIN_CHARS) {
        continue;
      }
      if (!hay.includes(phrase.toLowerCase())) {
        continue;
      }
      if (found.some((existing) => overlaps(existing, phrase))) {
        continue;
      }
      found.push(phrase);
      if (found.length >= limit) {
        return found;
      }
    }
  }

  return found;
}

export function citationsFromOutput(
  source: string,
  data: FormattedOutput,
  mode: OutputMode,
  limit = MAX_CITATIONS,
): string[] {
  return extractCitations(source, formattedOutputToPlainText(data, mode), limit);
}
