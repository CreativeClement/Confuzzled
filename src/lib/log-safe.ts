/**
 * Server-side logging helpers.
 *
 * Provider SDK errors can carry request details, including the Authorization
 * header built from a reader's API key. Nothing here may reach the log without
 * passing through `redact` first.
 */

// Deliberately loose: a provider that has already masked a key still gets
// scrubbed, because a partial key is not something we need in a log either.
const KEY_PATTERNS: RegExp[] = [
  /\bsk-[A-Za-z0-9_\-*]{4,}/g,
  /\bgsk_[A-Za-z0-9_\-*]{4,}/g,
  /\bBearer\s+[A-Za-z0-9._\-*]{4,}/gi,
  /(?:api[_-]?key|authorization)"?\s*[:=]\s*"?[A-Za-z0-9._\-*]{4,}/gi,
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
