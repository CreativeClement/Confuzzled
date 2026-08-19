export type SseEvent = Record<string, unknown>;

export function encodeSse(event: SseEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export function consumeSse(buffer: string): { events: SseEvent[]; rest: string } {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  const events: SseEvent[] = [];
  for (const part of parts) {
    const line = part
      .split("\n")
      .filter((row) => row.startsWith("data:"))
      .map((row) => row.slice(5).trim())
      .join("");
    if (!line) {
      continue;
    }
    try {
      const parsed = JSON.parse(line) as unknown;
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        events.push(parsed as SseEvent);
      }
    } catch {
      /* ignore a torn frame; it will arrive complete later */
    }
  }
  return { events, rest };
}

export function isLivePreviewMode(mode: string): boolean {
  return mode === "tl_dr" || mode === "feynman";
}
