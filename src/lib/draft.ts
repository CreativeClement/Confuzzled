export const DRAFT_STORAGE_KEY = "confuzzle-draft";
export const MAX_DRAFT_CHARS = 4000;

export type Draft = {
  text: string;
  updatedAt: string;
};

export function serializeDraft(text: string): string {
  const draft: Draft = {
    text: text.slice(0, MAX_DRAFT_CHARS),
    updatedAt: new Date().toISOString(),
  };
  return JSON.stringify(draft);
}

export function parseDraft(raw: string | null | undefined): Draft | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed == null || Array.isArray(parsed)) {
      return null;
    }
    const record = parsed as Record<string, unknown>;
    if (typeof record.text !== "string") {
      return null;
    }
    const text = record.text.slice(0, MAX_DRAFT_CHARS);
    if (!text.trim()) {
      return null;
    }
    return {
      text,
      updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : "",
    };
  } catch {
    return null;
  }
}

export function readDraft(store: { getItem(key: string): string | null }): Draft | null {
  return parseDraft(store.getItem(DRAFT_STORAGE_KEY));
}

export function writeDraft(store: { setItem(key: string, value: string): void }, text: string): void {
  if (!text.trim()) {
    return;
  }
  store.setItem(DRAFT_STORAGE_KEY, serializeDraft(text));
}

export function clearDraft(store: { removeItem(key: string): void }): void {
  store.removeItem(DRAFT_STORAGE_KEY);
}
