import { NextResponse } from "next/server";

import { serverApiKey } from "@/lib/provider-server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      // Whether this deployment can answer without the reader supplying a key.
      serverKey: Boolean(serverApiKey()),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
