import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  const key = process.env.OPENAI_API_KEY ?? "";
  return NextResponse.json({
    ok: true,
    openai: Boolean(key) && !key.includes("your-openai-key"),
  });
}
