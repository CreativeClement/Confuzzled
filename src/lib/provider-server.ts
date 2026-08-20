import { createOpenAI } from "@ai-sdk/openai";

import { BYOK_HEADERS } from "@/lib/byok";
import { resolveProvider, type ProviderResolution, type ResolvedProvider } from "@/lib/providers";

/**
 * Work out which provider serves this request.
 *
 * A key sent from the browser wins. Otherwise Confuzzle falls back to the
 * server's own environment key, so a self-hosted deployment can serve readers
 * who have no key of their own.
 */
export function providerFromRequest(
  request: Request,
  options: { wantsVision: boolean },
): ProviderResolution {
  const headerKey = request.headers.get(BYOK_HEADERS.key)?.trim() ?? "";

  if (headerKey) {
    return resolveProvider({
      provider: request.headers.get(BYOK_HEADERS.provider),
      key: headerKey,
      model: request.headers.get(BYOK_HEADERS.model),
      baseUrl: request.headers.get(BYOK_HEADERS.baseUrl),
      wantsVision: options.wantsVision,
    });
  }

  const serverKey = serverApiKey();
  if (!serverKey) {
    return {
      ok: false,
      error: "Confuzzle needs an API key. Add yours in Settings — it stays in this browser.",
    };
  }

  return resolveProvider({
    provider: process.env.CONFUZZLE_PROVIDER ?? "openai",
    key: serverKey,
    model: process.env.CONFUZZLE_MODEL ?? null,
    baseUrl: process.env.CONFUZZLE_BASE_URL ?? null,
    wantsVision: options.wantsVision,
  });
}

export function serverApiKey(): string {
  const key = (process.env.CONFUZZLE_API_KEY ?? process.env.OPENAI_API_KEY ?? "").trim();
  if (!key || key.includes("your-openai-key")) {
    return "";
  }
  return key;
}

export function providerModel(provider: ResolvedProvider) {
  const client = createOpenAI({
    apiKey: provider.key,
    baseURL: provider.baseUrl,
    compatibility: provider.strict ? "strict" : "compatible",
    headers:
      provider.id === "openrouter"
        ? { "HTTP-Referer": "https://github.com/CreativeClement/Confuzzled", "X-Title": "Confuzzle" }
        : undefined,
  });
  return client(provider.model);
}
