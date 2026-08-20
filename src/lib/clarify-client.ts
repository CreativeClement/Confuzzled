import type { InputType, OutputMode } from "@/lib/input-router";
import type { ClarifyImage } from "@/lib/image-payload";
import type { FormattedOutput } from "@/lib/output-formatter";
import { byokHeaders, readByok, type ByokSettings } from "@/lib/byok";
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
  needsKey?: boolean;
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

function currentSettings(): ByokSettings | null {
  if (typeof window === "undefined") {
    return null;
  }
  return readByok(window.localStorage);
}

function requestHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...byokHeaders(currentSettings()),
    ...extra,
  };
}

/** Never let a non-JSON error page (proxy 502, captive portal) throw at the caller. */
async function readJson(response: Response): Promise<ClarifyResponse> {
  let raw: string;
  try {
    raw = await response.text();
  } catch {
    return { success: false, error: "The reply was cut off. Try again.", data: null };
  }
  try {
    return JSON.parse(raw) as ClarifyResponse;
  } catch {
    return {
      success: false,
      error:
        response.status >= 500
          ? "The server returned an error page. Try again in a moment."
          : "The server sent a reply Confuzzle could not read.",
      data: null,
    };
  }
}

/** A `done` event must actually carry a result before we treat it as success. */
function asSuccess(event: Record<string, unknown>): ClarifyResponse {
  if (event.data == null || typeof event.mode !== "string" || typeof event.inputType !== "string") {
    return { success: false, error: "The reply came back incomplete. Try again.", data: null };
  }
  return event as unknown as ClarifySuccess;
}

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
    headers: requestHeaders(),
    body: JSON.stringify(clarifyBody(input)),
    signal: input.signal,
  });
  return readJson(response);
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
    headers: requestHeaders({ Accept: "text/event-stream" }),
    body: JSON.stringify(clarifyBody({ ...input, stream: true })),
    signal: input.signal,
  });

  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("text/event-stream")) {
    return readJson(response);
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
        finalPayload = asSuccess(event);
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

/** Returns null when the check itself failed, which is not the same as "no key". */
export async function requestHealth(
  signal?: AbortSignal,
): Promise<{ ok: boolean; serverKey: boolean } | null> {
  try {
    const response = await fetch("/api/health", { signal, cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    const payload = (await response.json()) as { ok?: boolean; serverKey?: boolean };
    return { ok: Boolean(payload.ok), serverKey: Boolean(payload.serverKey) };
  } catch {
    return null;
  }
}

export type KeyCheckResult =
  | { ok: true; provider: string; model: string }
  | { ok: false; error: string };

export async function checkKey(
  settings: ByokSettings,
  signal?: AbortSignal,
): Promise<KeyCheckResult> {
  try {
    const response = await fetch("/api/key-check", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...byokHeaders(settings) },
      signal,
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
      provider?: string;
      model?: string;
    };
    if (payload.ok) {
      return { ok: true, provider: payload.provider ?? "", model: payload.model ?? "" };
    }
    return { ok: false, error: payload.error ?? "That key did not work." };
  } catch {
    return { ok: false, error: "Could not reach the provider. Check your connection." };
  }
}
