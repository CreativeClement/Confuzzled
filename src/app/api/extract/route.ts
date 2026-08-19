import { NextResponse } from "next/server";

import { extractPdfText } from "@/lib/pdf-text";
import { getClientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 6 * 1024 * 1024;
const MAX_CHARS = 4000;

export async function POST(request: Request) {
  const rate = rateLimit(getClientKey(request));
  if (!rate.ok) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Wait a minute and try again.", text: null },
      { status: 429 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "Upload the PDF as form data.", text: null },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "Choose a PDF to extract.", text: null },
      { status: 400 },
    );
  }

  const name = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  if (!isPdf) {
    return NextResponse.json(
      { success: false, error: "Only PDF text extraction is supported here.", text: null },
      { status: 400 },
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { success: false, error: "That PDF is too large. Paste the relevant pages instead.", text: null },
      { status: 400 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const extracted = await extractPdfText(buffer);
    if (!extracted) {
      return NextResponse.json(
        {
          success: false,
          error: "No selectable text in that PDF. Paste what you can read, or add notes.",
          text: null,
        },
        { status: 422 },
      );
    }
    const clipped = extracted.length > MAX_CHARS;
    const text = clipped ? extracted.slice(0, MAX_CHARS) : extracted;
    return NextResponse.json({
      success: true,
      text: `[[input:pdf]]\nExtracted from ${file.name}${clipped ? " (truncated)" : ""}:\n${text}`,
      truncated: clipped,
    });
  } catch (error) {
    console.error("Confuzzled /api/extract failed", error);
    return NextResponse.json(
      {
        success: false,
        error: "Could not read that PDF. Paste the text instead.",
        text: null,
      },
      { status: 500 },
    );
  }
}
