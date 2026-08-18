import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  buildSystemPrompt,
  detectInputType,
  isOutputMode,
  type OutputMode,
} from "@/lib/input-router";
import { formatOutput } from "@/lib/output-formatter";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { AUDIENCE_ROLE_OPTIONS, isAudienceRole } from "@/lib/workspace";
import { clarifyProviderError } from "@/lib/clarify-errors";

export const runtime = "nodejs";

const MAX_INPUT_CHARS = 4000;
const MAX_OUTPUT_TOKENS = 1000;

const clarifySchema = z.object({
  content: z.string().min(1, "Content is required."),
  mode: z.string().optional(),
  role: z.string().optional(),
});

function corsHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  headers.set("Access-Control-Max-Age", "86400");
  headers.set("Cache-Control", "no-store");
  return headers;
}

function withRateLimitHeaders(headers: Headers, limit: {
  limit: number;
  remaining: number;
  resetAt: number;
}): Headers {
  headers.set("X-RateLimit-Limit", String(limit.limit));
  headers.set("X-RateLimit-Remaining", String(limit.remaining));
  headers.set("X-RateLimit-Reset", String(Math.ceil(limit.resetAt / 1000)));
  return headers;
}

function jsonResponse(
  body: Record<string, unknown>,
  init: { status: number; rate: ReturnType<typeof rateLimit> },
) {
  const headers = withRateLimitHeaders(corsHeaders(), init.rate);
  if (!init.rate.ok) {
    headers.set("Retry-After", String(Math.max(1, Math.ceil((init.rate.resetAt - Date.now()) / 1000))));
  }
  return NextResponse.json(body, { status: init.status, headers });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  const rate = rateLimit(getClientKey(request));

  if (!rate.ok) {
    return jsonResponse(
      {
        success: false,
        error: "Too many requests. Wait a minute and try again.",
        data: null,
        mode: null,
        inputType: null,
      },
      { status: 429, rate },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(
      {
        success: false,
        error: "Request body must be valid JSON.",
        data: null,
        mode: null,
        inputType: null,
      },
      { status: 400, rate },
    );
  }

  const parsed = clarifySchema.safeParse(payload);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Invalid input.";
    return jsonResponse(
      {
        success: false,
        error: message,
        data: null,
        mode: null,
        inputType: null,
      },
      { status: 400, rate },
    );
  }

  const modeValue = parsed.data.mode ?? "tl_dr";
  if (!isOutputMode(modeValue)) {
    return jsonResponse(
      {
        success: false,
        error: "Mode must be one of: TL;DR, Step-by-Step, Feynman, Socratic, Visual, Flashcards.",
        data: null,
        mode: modeValue,
        inputType: null,
      },
      { status: 400, rate },
    );
  }

  const mode: OutputMode = modeValue;
  const content = parsed.data.content.trim();
  if (!content) {
    return jsonResponse(
      {
        success: false,
        error: "Paste or upload something to unconfuzzle.",
        data: null,
        mode,
        inputType: null,
      },
      { status: 400, rate },
    );
  }

  const truncated = content.length > MAX_INPUT_CHARS;
  const prompt = truncated ? content.slice(0, MAX_INPUT_CHARS) : content;
  const inputType = detectInputType(prompt);
  const role = parsed.data.role && isAudienceRole(parsed.data.role) ? parsed.data.role : null;
  const roleMeta = role ? AUDIENCE_ROLE_OPTIONS.find((option) => option.value === role) : null;
  const system = [
    buildSystemPrompt(mode, inputType),
    roleMeta
      ? `READER: ${roleMeta.label}. ${roleMeta.description} Prefer examples and vocabulary that fit that life. Do not assume they are a student.`
      : "",
    truncated
      ? `The user input was truncated to ${MAX_INPUT_CHARS} characters for token safety. Work only from what remains.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("your-openai-key")) {
    return jsonResponse(
      {
        success: false,
        error: "The server is missing OPENAI_API_KEY. Add it to .env.local and restart.",
        data: null,
        mode,
        inputType,
      },
      { status: 500, rate },
    );
  }

  try {
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system,
      prompt,
      maxTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.4,
    });

    const data = formatOutput(result.text, mode);

    return jsonResponse(
      {
        success: true,
        data,
        mode,
        inputType,
        truncated,
      },
      { status: 200, rate },
    );
  } catch (error) {
    console.error("Confuzzled /api/clarify failed", error);
    const mapped = clarifyProviderError(error);
    return jsonResponse(
      {
        success: false,
        error: mapped.message,
        data: null,
        mode,
        inputType,
      },
      { status: mapped.status, rate },
    );
  }
}
