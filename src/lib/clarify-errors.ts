function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function collectErrorText(error: unknown): { status: number | null; text: string } {
  const parts: string[] = [];
  let status: number | null = null;
  const seen = new Set<unknown>();

  const walk = (value: unknown, depth: number) => {
    if (value == null || depth > 4 || seen.has(value)) {
      return;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      parts.push(String(value));
      return;
    }
    const record = asRecord(value);
    if (!record) {
      return;
    }
    seen.add(value);
    if (typeof record.statusCode === "number" && status == null) {
      status = record.statusCode;
    }
    if (typeof record.status === "number" && status == null) {
      status = record.status;
    }
    if (typeof record.message === "string") {
      parts.push(record.message);
    }
    if (typeof record.code === "string") {
      parts.push(record.code);
    }
    walk(record.cause, depth + 1);
    walk(record.lastError, depth + 1);
    walk(record.data, depth + 1);
    walk(record.error, depth + 1);
  };

  walk(error, 0);
  return { status, text: parts.join(" ").toLowerCase() };
}

export function clarifyProviderError(
  error: unknown,
  providerLabel = "The provider",
): { status: number; message: string } {
  const { status, text } = collectErrorText(error);

  if (
    status === 401 ||
    text.includes("invalid api key") ||
    text.includes("incorrect api key") ||
    text.includes("invalid_api_key") ||
    text.includes("no auth credentials")
  ) {
    return {
      status: 401,
      message: `${providerLabel} rejected that API key. Check it in Settings and paste it again.`,
    };
  }

  if (
    text.includes("insufficient_quota") ||
    text.includes("exceeded your current quota") ||
    text.includes("insufficient credits") ||
    text.includes("billing")
  ) {
    return {
      status: 402,
      message: `${providerLabel} says this key has no credit left. Add credit, or switch provider in Settings.`,
    };
  }

  if (status === 429) {
    return {
      status: 429,
      message: `${providerLabel} is rate-limiting this key. Wait a minute and try again.`,
    };
  }

  if (
    status === 404 ||
    text.includes("model_not_found") ||
    text.includes("does not exist") ||
    text.includes("unknown model")
  ) {
    return {
      status: 400,
      message: `${providerLabel} does not have that model. Pick another one in Settings.`,
    };
  }

  if (status === 403) {
    return {
      status: 403,
      message: `This key is not allowed to use that model on ${providerLabel}. Enable it, or pick another model in Settings.`,
    };
  }

  if (
    text.includes("aborterror") ||
    text.includes("timeout") ||
    text.includes("the operation was aborted")
  ) {
    return {
      status: 504,
      message: "That took too long. Try a shorter passage, or try again.",
    };
  }

  if (text.includes("image") && (text.includes("not support") || text.includes("unsupported"))) {
    return {
      status: 400,
      message: `That model cannot read images. Pick a vision model in Settings, or type the words you can read.`,
    };
  }

  return {
    status: 500,
    message: "The model could not finish. Try a shorter passage or another lens.",
  };
}
