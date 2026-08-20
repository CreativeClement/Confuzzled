import { isProviderId, type ProviderId } from "@/lib/providers";

export const BYOK_STORAGE_KEY = "confuzzle-provider";

export type ByokSettings = {
  provider: ProviderId;
  key: string;
  model: string;
  baseUrl: string;
};

export type KeyValueStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const EMPTY_BYOK: ByokSettings = {
  provider: "openai",
  key: "",
  model: "",
  baseUrl: "",
};

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseByok(raw: string | null): ByokSettings | null {
  if (!raw) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  const provider = isProviderId(record.provider) ? record.provider : "openai";
  return {
    provider,
    key: asString(record.key),
    model: asString(record.model),
    baseUrl: asString(record.baseUrl),
  };
}

export function readByok(store: KeyValueStore): ByokSettings {
  try {
    return parseByok(store.getItem(BYOK_STORAGE_KEY)) ?? EMPTY_BYOK;
  } catch {
    return EMPTY_BYOK;
  }
}

export function writeByok(store: KeyValueStore, settings: ByokSettings): void {
  try {
    store.setItem(BYOK_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* private mode or quota */
  }
}

export function clearByok(store: KeyValueStore): void {
  try {
    store.removeItem(BYOK_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasKey(settings: ByokSettings | null): boolean {
  return Boolean(settings?.key);
}

/** Never render a full key back to the screen. */
export function maskKey(key: string): string {
  if (!key) {
    return "";
  }
  if (key.length <= 10) {
    return `${key.slice(0, 2)}${"•".repeat(Math.max(2, key.length - 2))}`;
  }
  return `${key.slice(0, 6)}${"•".repeat(8)}${key.slice(-4)}`;
}

export const BYOK_HEADERS = {
  provider: "x-confuzzle-provider",
  key: "x-confuzzle-key",
  model: "x-confuzzle-model",
  baseUrl: "x-confuzzle-base-url",
} as const;

export function byokHeaders(settings: ByokSettings | null): Record<string, string> {
  if (!settings?.key) {
    return {};
  }
  const headers: Record<string, string> = {
    [BYOK_HEADERS.provider]: settings.provider,
    [BYOK_HEADERS.key]: settings.key,
  };
  if (settings.model) {
    headers[BYOK_HEADERS.model] = settings.model;
  }
  if (settings.baseUrl) {
    headers[BYOK_HEADERS.baseUrl] = settings.baseUrl;
  }
  return headers;
}
