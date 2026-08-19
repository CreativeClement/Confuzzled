import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { citationsFromOutput } from "@/lib/citations";
import { clarifyProviderError } from "@/lib/clarify-errors";
import { enrichWithFetchedUrl } from "@/lib/fetch-public";
import { clarifyImageToBuffer, parseClarifyImage, type ClarifyImage } from "@/lib/image-payload";
import {
  buildSystemPrompt,
  detectInputType,
  isOutputMode,
  type OutputMode,
} from "@/lib/input-router";
import { buildFocusPrompt, recommendOutputMode } from "@/lib/lens";
import { formatOutput, isThinOutput } from "@/lib/output-formatter";
import { getClientKey, rateLimit } from "@/lib/rate-limit";
import { AUDIENCE_ROLE_OPTIONS, isAudienceRole } from "@/lib/workspace";

export const runtime = "nodejs";

const MAX_INPUT_CHARS = 4000;
const MAX_OUTPUT_TOKENS = 1000;
const COMPLETION_TIMEOUT_MS = 25_000;

const clarifySchema = z.object({
  content: z.string().min(1, "Content is required."),
  mode: z.string().optional(),
  role: z.string().optional(),
  focus: z
    .object({
      step: z.number().int().positive(),
      text: z.string().min(1).max(800),
    })
    .optional(),
  image: z.unknown().optional(),
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

function withRateLimitHeaders(
  headers: Headers,
  limit: {
    limit: number;
    remaining: number;
    resetAt: number;
  },
): Headers {
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

async function completeClarify(options: {
  system: string;
  prompt: string;
  image: ClarifyImage | null;
}): Promise<string> {
  const abortSignal = AbortSignal.timeout(COMPLETION_TIMEOUT_MS);
  if (options.image) {
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: options.system,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: options.prompt },
            { type: "image", image: clarifyImageToBuffer(options.image) },
          ],
        },
      ],
      maxTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.4,
      abortSignal,
    });
    return result.text;
  }

  const result = await generateText({
    model: openai("gpt-4o-mini"),
    system: options.system,
    prompt: options.prompt,
    maxTokens: MAX_OUTPUT_TOKENS,
    temperature: 0.4,
    abortSignal,
  });
  return result.text;
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

  const imageParsed = parseClarifyImage(parsed.data.image);
  if (imageParsed && !imageParsed.ok) {
    return jsonResponse(
      {
        success: false,
        error: imageParsed.error,
        data: null,
        mode: null,
        inputType: "image",
      },
      { status: 400, rate },
    );
  }
  const image = imageParsed?.ok ? imageParsed.image : null;

  const content = parsed.data.content.trim();
  const focus = parsed.data.focus;
  const requestedMode = parsed.data.mode ?? (focus ? "feynman" : "auto");
  let mode: OutputMode;
  if (focus) {
    mode = "feynman";
  } else if (requestedMode === "auto") {
    mode = recommendOutputMode(content);
  } else if (isOutputMode(requestedMode)) {
    mode = requestedMode;
  } else {
    return jsonResponse(
      {
        success: false,
        error: "Mode must be one of: auto, TL;DR, Step-by-Step, Feynman, Socratic, Visual, Flashcards.",
        data: null,
        mode: requestedMode,
        inputType: null,
      },
      { status: 400, rate },
    );
  }

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
  const promptSource = truncated ? content.slice(0, MAX_INPUT_CHARS) : content;
  const inputType = image ? "image" : detectInputType(promptSource);
  let workingSource = promptSource;
  let fetched = false;
  let fetchWarning: string | null = null;
  if (inputType === "url" && !focus) {
    const enriched = await enrichWithFetchedUrl(promptSource);
    workingSource = enriched.prompt.slice(0, MAX_INPUT_CHARS + 3_200);
    fetched = enriched.fetched;
    fetchWarning = enriched.warning;
  }
  const prompt = focus
    ? buildFocusPrompt(workingSource, focus.step, focus.text)
    : workingSource;
  const role = parsed.data.role && isAudienceRole(parsed.data.role) ? parsed.data.role : null;
  const roleMeta = role ? AUDIENCE_ROLE_OPTIONS.find((option) => option.value === role) : null;
  const system = [
    buildSystemPrompt(mode, inputType),
    roleMeta
      ? `READER: ${roleMeta.label}. ${roleMeta.description} Prefer examples and vocabulary that fit that life. Do not assume they are a student.`
      : "",
    focus
      ? `FOCUS: The reader is stuck on step ${focus.step}. Teach only that step. Do not invent tools, voltages, dosages, or legal outcomes.`
      : "",
    image
      ? "A photograph is attached as pixels. Read visible text. If a label is blurry, say you cannot read it. Do not invent serials, voltages, dosages, or legal outcomes."
      : "",
    fetched
      ? "A public page was fetched and appended as an extract. Stay faithful to that extract plus the user's notes."
      : "",
    fetchWarning ? `FETCH NOTE: ${fetchWarning}` : "",
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
    let raw = await completeClarify({ system, prompt, image });
    let data = formatOutput(raw, mode);
    if (isThinOutput(data, mode)) {
      raw = await completeClarify({
        system: `${system}\nRETRY: Your previous reply could not be parsed. Match the MODE contract exactly. JSON only when the mode asks for JSON. No markdown fences.`,
        prompt,
        image,
      });
      data = formatOutput(raw, mode);
    }

    return jsonResponse(
      {
        success: true,
        data,
        mode,
        inputType,
        truncated,
        fetched,
        seen: Boolean(image),
        warning: fetchWarning,
        citations: citationsFromOutput(workingSource, data, mode),
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
