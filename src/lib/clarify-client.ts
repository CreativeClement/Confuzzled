import type { InputType, OutputMode } from "@/lib/input-router";
import type { ClarifyImage } from "@/lib/image-payload";
import type { FormattedOutput } from "@/lib/output-formatter";

export type ClarifySuccess = {
  success: true;
  data: FormattedOutput;
  mode: OutputMode;
  inputType: InputType;
  truncated?: boolean;
  fetched?: boolean;
  seen?: boolean;
  warning?: string | null;
  citations?: string[];
};

export type ClarifyFailure = {
  success: false;
  error: string;
  data: null;
};

export type ClarifyResponse = ClarifySuccess | ClarifyFailure;

export async function requestClarify(input: {
  content: string;
  mode: OutputMode | "auto";
  role?: string;
  focus?: { step: number; text: string };
  image?: ClarifyImage | null;
  signal?: AbortSignal;
}): Promise<ClarifyResponse> {
  const { signal, ...body } = input;
  const response = await fetch("/api/clarify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: body.content,
      mode: body.mode,
      role: body.role,
      focus: body.focus,
      image: body.image ?? undefined,
    }),
    signal,
  });
  return (await response.json()) as ClarifyResponse;
}

export async function requestHealth(signal?: AbortSignal): Promise<{ ok: boolean; openai: boolean } | null> {
  try {
    const response = await fetch("/api/health", { signal, cache: "no-store" });
    const payload = (await response.json()) as { ok?: boolean; openai?: boolean };
    return { ok: Boolean(payload.ok), openai: Boolean(payload.openai) };
  } catch {
    return null;
  }
}
