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

export function clarifyProviderError(error: unknown): { status: number; message: string } {
  const { status, text } = collectErrorText(error);

  if (
    status === 401 ||
    text.includes("invalid api key") ||
    text.includes("incorrect api key") ||
    text.includes("invalid_api_key")
  ) {
    return {
      status: 500,
      message: "The OpenAI API key was rejected. Check OPENAI_API_KEY and restart the server.",
    };
  }

  if (text.includes("insufficient_quota") || text.includes("exceeded your current quota")) {
    return {
      status: 502,
      message:
        "OpenAI says this key is out of quota. Add billing or credits at platform.openai.com, then try Generate again.",
    };
  }

  if (status === 429) {
    return {
      status: 429,
      message: "OpenAI is rate-limiting this key. Wait a minute and try again.",
    };
  }

  if (status === 403) {
    return {
      status: 502,
      message: "This key cannot use gpt-4o-mini. Enable that model on the OpenAI project and try again.",
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

  return {
    status: 500,
    message: "The model could not finish. Try a shorter passage or another mode.",
  };
}
