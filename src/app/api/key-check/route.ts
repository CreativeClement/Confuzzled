import { generateText } from "ai";
import { NextResponse } from "next/server";

import { clarifyProviderError } from "@/lib/clarify-errors";
import { safeErrorLine } from "@/lib/log-safe";
import { providerFromRequest, providerModel } from "@/lib/provider-server";
import { getClientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Spend one tiny completion to prove a key works, so a reader finds out here
 * rather than halfway through something they care about.
 */
export async function POST(request: Request) {
  const rate = rateLimit(getClientKey(request));
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many checks. Wait a minute." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  const resolved = providerFromRequest(request, { wantsVision: false });
  if (!resolved.ok) {
    return NextResponse.json(
      { ok: false, error: resolved.error },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await generateText({
      model: providerModel(resolved.provider),
      prompt: "Reply with the single word: ready",
      maxTokens: 5,
      temperature: 0,
      abortSignal: AbortSignal.timeout(15_000),
    });

    return NextResponse.json(
      {
        ok: true,
        provider: resolved.provider.label,
        model: resolved.provider.model,
        reply: result.text.trim().slice(0, 40),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Confuzzle /api/key-check failed:", safeErrorLine(error));
    const mapped = clarifyProviderError(error, resolved.provider.label);
    return NextResponse.json(
      { ok: false, error: mapped.message, provider: resolved.provider.label, model: resolved.provider.model },
      { status: mapped.status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
