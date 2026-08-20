import type { InputType, OutputMode } from "@/lib/input-router";
import type { ClarifyImage } from "@/lib/image-payload";
import type { FormattedOutput } from "@/lib/output-formatter";
import { consumeSse } from "@/lib/clarify-sse";

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

export type ClarifyStreamHandlers = {
  onMeta?: (meta: {
    mode: OutputMode;
    inputType: InputType;
    fetched?: boolean;
    seen?: boolean;
    warning?: string | null;
  }) => void;
  onDelta?: (text: string) => void;
  onRetry?: () => void;
};

function clarifyBody(input: {
  content: string;
  mode: OutputMode | "auto";
  role?: string;
  focus?: { step: number; text: string };
  image?: ClarifyImage | null;
  stream?: boolean;
}) {
  return {
    content: input.content,
    mode: input.mode,
    role: input.role,
    focus: input.focus,
    image: input.image ?? undefined,
    stream: input.stream,
  };
}

export async function requestClarify(input: {
  content: string;
  mode: OutputMode | "auto";
  role?: string;
  focus?: { step: number; text: string };
  image?: ClarifyImage | null;
  signal?: AbortSignal;
}): Promise<ClarifyResponse> {
  const response = await fetch("/api/clarify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clarifyBody(input)),
    signal: input.signal,
  });
  return (await response.json()) as ClarifyResponse;
}

export async function streamClarify(
  input: {
    content: string;
    mode: OutputMode | "auto";
    role?: string;
    image?: ClarifyImage | null;
    signal?: AbortSignal;
  },
  handlers: ClarifyStreamHandlers = {},
): Promise<ClarifyResponse> {
  const response = await fetch("/api/clarify", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(clarifyBody({ ...input, stream: true })),
    signal: input.signal,
  });

  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("text/event-stream")) {
    return (await response.json()) as ClarifyResponse;
  }

  if (!response.body) {
    return { success: false, error: "No reply stream came back.", data: null };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalPayload: ClarifyResponse | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const consumed = consumeSse(buffer);
    buffer = consumed.rest;
    for (const event of consumed.events) {
      const kind = event.type;
      if (kind === "meta") {
        handlers.onMeta?.({
          mode: event.mode as OutputMode,
          inputType: event.inputType as InputType,
          fetched: Boolean(event.fetched),
          seen: Boolean(event.seen),
          warning: typeof event.warning === "string" ? event.warning : null,
        });
      } else if (kind === "delta" && typeof event.text === "string") {
        handlers.onDelta?.(event.text);
      } else if (kind === "retry") {
        handlers.onRetry?.();
      } else if (kind === "done") {
        finalPayload = event as unknown as ClarifySuccess;
      } else if (kind === "error") {
        finalPayload = {
          success: false,
          error: typeof event.error === "string" ? event.error : "The model could not finish.",
          data: null,
        };
      }
    }
  }

  return finalPayload ?? { success: false, error: "The stream ended without a result.", data: null };
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
