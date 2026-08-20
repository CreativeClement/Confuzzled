import { NextResponse } from "next/server";

import { safeErrorLine } from "@/lib/log-safe";
import { providerFromRequest } from "@/lib/provider-server";
import { providerSpec } from "@/lib/providers";
import { getClientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_CHARS = 4000;
const AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/flac",
  "audio/aac",
]);

function isAudioFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (AUDIO_TYPES.has(file.type)) {
    return true;
  }
  return /\.(mp3|wav|m4a|aac|ogg|flac|webm)$/i.test(name);
}

export async function POST(request: Request) {
  const rate = rateLimit(getClientKey(request));
  if (!rate.ok) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Wait a minute and try again.", text: null },
      { status: 429 },
    );
  }

  const resolved = providerFromRequest(request, { wantsVision: false });
  if (!resolved.ok) {
    return NextResponse.json({ success: false, error: resolved.error, text: null }, { status: 400 });
  }

  const transcribeModel = providerSpec(resolved.provider.id).transcribeModel;
  if (!transcribeModel) {
    return NextResponse.json(
      {
        success: false,
        error: `${resolved.provider.label} cannot transcribe audio. Switch to OpenAI or Groq in Settings, or paste the words.`,
        text: null,
      },
      { status: 400 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Upload the audio as form data.", text: null },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "Choose an audio file to transcribe.", text: null },
      { status: 400 },
    );
  }
  if (!isAudioFile(file)) {
    return NextResponse.json(
      { success: false, error: "That is not an audio file we can hear. Paste a transcript instead.", text: null },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { success: false, error: "That recording is too large. Paste the words you need.", text: null },
      { status: 400 },
    );
  }

  try {
    const body = new FormData();
    body.append("file", file, file.name);
    body.append("model", transcribeModel);
    body.append("response_format", "text");

    const response = await fetch(`${resolved.provider.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${resolved.provider.key}` },
      body,
      signal: AbortSignal.timeout(45_000),
    });
    const raw = await response.text();
    if (!response.ok) {
      console.error("Confuzzle /api/transcribe provider", response.status, safeErrorLine(raw));
      if (raw.includes("insufficient_quota") || raw.includes("insufficient credits")) {
        return NextResponse.json(
          {
            success: false,
            error: `${resolved.provider.label} says this key has no credit left. Add credit, or paste a transcript.`,
            text: null,
          },
          { status: 402 },
        );
      }
      if (response.status === 401) {
        return NextResponse.json(
          {
            success: false,
            error: `${resolved.provider.label} rejected that API key. Check it in Settings.`,
            text: null,
          },
          { status: 401 },
        );
      }
      if (response.status === 429) {
        return NextResponse.json(
          {
            success: false,
            error: `${resolved.provider.label} is rate-limiting this key. Wait a minute and try again.`,
            text: null,
          },
          { status: 429 },
        );
      }
      return NextResponse.json(
        { success: false, error: "Could not hear that recording. Paste a transcript instead.", text: null },
        { status: 502 },
      );
    }

    const transcript = raw.trim();
    if (!transcript) {
      return NextResponse.json(
        { success: false, error: "No speech came back. Paste the words you can hear.", text: null },
        { status: 422 },
      );
    }
    const clipped = transcript.length > MAX_CHARS;
    const text = clipped ? transcript.slice(0, MAX_CHARS) : transcript;
    return NextResponse.json({
      success: true,
      text: `[[input:audio]]\nTranscript from ${file.name}${clipped ? " (truncated)" : ""}:\n${text}`,
      truncated: clipped,
    });
  } catch (error) {
    console.error("Confuzzle /api/transcribe failed:", safeErrorLine(error));
    return NextResponse.json(
      { success: false, error: "Could not hear that recording. Paste a transcript instead.", text: null },
      { status: 500 },
    );
  }
}
