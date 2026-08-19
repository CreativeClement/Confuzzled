import { generateText, streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { clarifyProviderError } from "@/lib/clarify-errors";
import {
  COMPLETION_TIMEOUT_MS,
  MAX_OUTPUT_TOKENS,
  failurePayload,
  prepareClarify,
  successPayload,
  type ClarifyPrep,
} from "@/lib/clarify-prepare";
import { encodeSse } from "@/lib/clarify-sse";
import { clarifyImageToBuffer, type ClarifyImage } from "@/lib/image-payload";
import { formatOutput, isThinOutput } from "@/lib/output-formatter";
import { getClientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const clarifySchema = z.object({
  content: z.string().min(1, "Content is required."),
  mode: z.string().optional(),
  role: z.string().optional(),
  stream: z.boolean().optional(),
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

function modelCall(options: {
  system: string;
  prompt: string;
  image: ClarifyImage | null;
  abortSignal: AbortSignal;
}) {
  if (options.image) {
    return {
      model: openai("gpt-4o-mini"),
      system: options.system,
      messages: [
        {
          role: "user" as const,
          content: [
            { type: "text" as const, text: options.prompt },
            { type: "image" as const, image: clarifyImageToBuffer(options.image) },
          ],
        },
      ],
      maxTokens: MAX_OUTPUT_TOKENS,
      temperature: 0.4,
      abortSignal: options.abortSignal,
    };
  }
  return {
    model: openai("gpt-4o-mini"),
    system: options.system,
    prompt: options.prompt,
    maxTokens: MAX_OUTPUT_TOKENS,
    temperature: 0.4,
    abortSignal: options.abortSignal,
  };
}

async function completeClarify(options: {
  system: string;
  prompt: string;
  image: ClarifyImage | null;
}): Promise<string> {
  const result = await generateText(
    modelCall({ ...options, abortSignal: AbortSignal.timeout(COMPLETION_TIMEOUT_MS) }),
  );
  return result.text;
}

function streamClarify(prep: ClarifyPrep, rate: ReturnType<typeof rateLimit>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(encodeSse(event)));
      };
      try {
        send({
          type: "meta",
          mode: prep.mode,
          inputType: prep.inputType,
          truncated: prep.truncated,
          fetched: prep.fetched,
          seen: Boolean(prep.image),
          warning: prep.fetchWarning,
        });
        const streamed = streamText(
          modelCall({
            system: prep.system,
            prompt: prep.prompt,
            image: prep.image,
            abortSignal: AbortSignal.timeout(COMPLETION_TIMEOUT_MS),
          }),
        );
        for await (const delta of streamed.textStream) {
          if (delta) {
            send({ type: "delta", text: delta });
          }
        }
        let raw = await streamed.text;
        let data = formatOutput(raw, prep.mode);
        if (isThinOutput(data, prep.mode)) {
          send({ type: "retry" });
          raw = await completeClarify({
            system: `${prep.system}\nRETRY: Your previous reply could not be parsed. Match the MODE contract exactly. JSON only when the mode asks for JSON. No markdown fences.`,
            prompt: prep.prompt,
            image: prep.image,
          });
          data = formatOutput(raw, prep.mode);
        }
        send({ type: "done", ...successPayload(prep, data) });
      } catch (error) {
        console.error("Confuzzled /api/clarify stream failed", error);
        const mapped = clarifyProviderError(error);
        send({ type: "error", error: mapped.message, status: mapped.status });
      } finally {
        controller.close();
      }
    },
  });

  const headers = withRateLimitHeaders(corsHeaders(), rate);
  headers.set("Content-Type", "text/event-stream; charset=utf-8");
  headers.set("X-Accel-Buffering", "no");
  return new Response(stream, { status: 200, headers });
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

  const prepared = await prepareClarify(parsed.data);
  if (!prepared.ok) {
    return jsonResponse(failurePayload(prepared.failure), { status: prepared.failure.status, rate });
  }

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes("your-openai-key")) {
    return jsonResponse(
      {
        success: false,
        error: "The server is missing OPENAI_API_KEY. Add it to .env.local and restart.",
        data: null,
        mode: prepared.prep.mode,
        inputType: prepared.prep.inputType,
      },
      { status: 500, rate },
    );
  }

  if (parsed.data.stream && !parsed.data.focus) {
    return streamClarify(prepared.prep, rate);
  }

  try {
    let raw = await completeClarify({
      system: prepared.prep.system,
      prompt: prepared.prep.prompt,
      image: prepared.prep.image,
    });
    let data = formatOutput(raw, prepared.prep.mode);
    if (isThinOutput(data, prepared.prep.mode)) {
      raw = await completeClarify({
        system: `${prepared.prep.system}\nRETRY: Your previous reply could not be parsed. Match the MODE contract exactly. JSON only when the mode asks for JSON. No markdown fences.`,
        prompt: prepared.prep.prompt,
        image: prepared.prep.image,
      });
      data = formatOutput(raw, prepared.prep.mode);
    }

    return jsonResponse(successPayload(prepared.prep, data), { status: 200, rate });
  } catch (error) {
    console.error("Confuzzled /api/clarify failed", error);
    const mapped = clarifyProviderError(error);
    return jsonResponse(
      {
        success: false,
        error: mapped.message,
        data: null,
        mode: prepared.prep.mode,
        inputType: prepared.prep.inputType,
      },
      { status: mapped.status, rate },
    );
  }
}
