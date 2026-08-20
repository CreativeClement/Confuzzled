/**
 * Server-side logging helpers.
 *
 * Provider SDK errors can carry request details, including the Authorization
 * header built from a reader's API key. Nothing here may reach the log without
 * passing through `redact` first.
 */

const KEY_PATTERNS: RegExp[] = [
  /\bsk-[A-Za-z0-9_\-]{8,}/g,
  /\bgsk_[A-Za-z0-9_\-]{8,}/g,
  /\bBearer\s+[A-Za-z0-9._\-]{8,}/gi,
  /\b[A-Za-z0-9_\-]{0,10}(?:api[_-]?key|authorization)"?\s*[:=]\s*"?[A-Za-z0-9._\-]{8,}/gi,
];

export function redact(value: string): string {
  return KEY_PATTERNS.reduce((text, pattern) => text.replace(pattern, "[redacted]"), value);
}

/** Reduce an unknown error to a short, key-free line safe for server logs. */
export function safeErrorLine(error: unknown): string {
  let text: string;
  if (error instanceof Error) {
    text = `${error.name}: ${error.message}`;
  } else if (typeof error === "string") {
    text = error;
  } else {
    try {
      text = JSON.stringify(error);
    } catch {
      text = String(error);
    }
  }
  return redact(text ?? "").slice(0, 500);
}
