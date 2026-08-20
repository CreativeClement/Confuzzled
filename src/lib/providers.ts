/**
 * Provider registry for Confuzzle.
 *
 * Confuzzle talks to any OpenAI-compatible chat completions endpoint, so a
 * reader can bring a key from whichever service they already pay for. The key
 * travels on the request and is never stored on the server.
 */

export const PROVIDER_IDS = ["openai", "groq", "openrouter", "custom"] as const;

export type ProviderId = (typeof PROVIDER_IDS)[number];

export type ProviderSpec = {
  id: ProviderId;
  label: string;
  /** Fixed OpenAI-compatible base URL, or null when the reader supplies one. */
  baseUrl: string | null;
  textModel: string;
  /** Model used when a scan or photo is attached, or null when the provider cannot see images. */
  visionModel: string | null;
  /** Speech-to-text model on /audio/transcriptions, or null when unsupported. */
  transcribeModel: string | null;
  keyPrefix: string | null;
  consoleUrl: string;
  blurb: string;
};

export const PROVIDERS: readonly ProviderSpec[] = [
  {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    textModel: "gpt-4o-mini",
    visionModel: "gpt-4o-mini",
    transcribeModel: "whisper-1",
    keyPrefix: "sk-",
    consoleUrl: "https://platform.openai.com/api-keys",
    blurb: "Reads scans and photos. Needs billing on the OpenAI project.",
  },
  {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    textModel: "llama-3.3-70b-versatile",
    visionModel: "meta-llama/llama-4-scout-17b-16e-instruct",
    transcribeModel: "whisper-large-v3",
    keyPrefix: "gsk_",
    consoleUrl: "https://console.groq.com/keys",
    blurb: "Fast, and the free tier is usually enough to try Confuzzle.",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    textModel: "openai/gpt-4o-mini",
    visionModel: "openai/gpt-4o-mini",
    transcribeModel: null,
    keyPrefix: "sk-or-",
    consoleUrl: "https://openrouter.ai/keys",
    blurb: "One key for many models, including Claude and Gemini.",
  },
  {
    id: "custom",
    label: "Other (OpenAI-compatible)",
    baseUrl: null,
    textModel: "",
    visionModel: null,
    transcribeModel: null,
    keyPrefix: null,
    consoleUrl: "https://platform.openai.com/docs/api-reference/chat",
    blurb: "Any endpoint that speaks /chat/completions. You supply the URL and model.",
  },
] as const;

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && (PROVIDER_IDS as readonly string[]).includes(value);
}

export function providerSpec(id: ProviderId): ProviderSpec {
  const found = PROVIDERS.find((provider) => provider.id === id);
  if (!found) {
    throw new Error(`Unknown provider: ${id}`);
  }
  return found;
}

export type ResolvedProvider = {
  id: ProviderId;
  label: string;
  baseUrl: string;
  model: string;
  key: string;
  /** OpenAI's own API accepts strict params; compatible endpoints get the safe subset. */
  strict: boolean;
};

export type ProviderResolution =
  | { ok: true; provider: ResolvedProvider }
  | { ok: false; error: string };

const MAX_KEY_CHARS = 400;

/** A key must be a single opaque token — no spaces, quotes, or newlines. */
export function looksLikeKey(value: string): boolean {
  if (!value || value.length > MAX_KEY_CHARS) {
    return false;
  }
  return !/[\s"'<>]/.test(value);
}

function normalizeBaseUrl(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") {
    return null;
  }
  return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "")}`;
}

export function resolveProvider(input: {
  provider?: string | null;
  key?: string | null;
  model?: string | null;
  baseUrl?: string | null;
  wantsVision?: boolean;
}): ProviderResolution {
  const id: ProviderId = isProviderId(input.provider) ? input.provider : "openai";
  const spec = providerSpec(id);
  const key = (input.key ?? "").trim();

  if (!key) {
    return { ok: false, error: `Add a ${spec.label} API key in Settings, then try again.` };
  }
  if (!looksLikeKey(key)) {
    return { ok: false, error: "That API key looks malformed. Paste the key on its own, with no quotes or spaces." };
  }

  let baseUrl = spec.baseUrl;
  if (id === "custom") {
    const normalized = normalizeBaseUrl((input.baseUrl ?? "").trim());
    if (!normalized) {
      return { ok: false, error: "Give the endpoint's https base URL, for example https://example.com/v1." };
    }
    baseUrl = normalized;
  }
  if (!baseUrl) {
    return { ok: false, error: `${spec.label} has no endpoint configured.` };
  }

  const requestedModel = (input.model ?? "").trim();
  let model = requestedModel;
  if (!model) {
    model = input.wantsVision ? spec.visionModel ?? "" : spec.textModel;
  } else if (input.wantsVision && !requestedModel) {
    model = spec.visionModel ?? "";
  }

  if (!model) {
    return input.wantsVision
      ? {
          ok: false,
          error: `${spec.label} has no image model set here. Type the words you can read, or switch provider in Settings.`,
        }
      : { ok: false, error: `Pick a model for ${spec.label} in Settings.` };
  }

  return {
    ok: true,
    provider: {
      id,
      label: spec.label,
      baseUrl,
      model,
      key,
      strict: id === "openai",
    },
  };
}
