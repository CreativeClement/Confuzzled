import dns from "node:dns/promises";

import { extractHttpUrls, htmlToReadableExtract, isPrivateIp, parsePublicHttpUrl } from "@/lib/public-url";

const MAX_HOPS = 3;
const MAX_BYTES = 180_000;
const MAX_CHARS = 2_800;
const TIMEOUT_MS = 8_000;

async function hostIsPublic(hostname: string): Promise<boolean> {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (isPrivateIp(host)) {
    return false;
  }
  try {
    const records = await dns.lookup(host, { all: true });
    if (records.length === 0) {
      return false;
    }
    return records.every((record) => !isPrivateIp(record.address));
  } catch {
    return false;
  }
}

async function fetchHop(url: URL): Promise<Response> {
  const publicHost = await hostIsPublic(url.hostname);
  if (!publicHost) {
    throw new Error("That host cannot be fetched.");
  }
  return fetch(url, {
    method: "GET",
    redirect: "manual",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Accept: "text/html,text/plain,application/pdf;q=0.8,*/*;q=0.1",
      "User-Agent": "Confuzzle/1.0 (+https://github.com/CreativeClement/Confuzzled)",
    },
  });
}

export async function fetchPublicPage(rawUrl: string): Promise<
  { ok: true; text: string; finalUrl: string } | { ok: false; error: string }
> {
  const first = parsePublicHttpUrl(rawUrl);
  if (!first.ok) {
    return first;
  }

  let current = first.url;
  try {
    for (let hop = 0; hop <= MAX_HOPS; hop += 1) {
      const response = await fetchHop(current);
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) {
          return { ok: false, error: "The page redirected without a location." };
        }
        const next = parsePublicHttpUrl(new URL(location, current).toString());
        if (!next.ok) {
          return next;
        }
        current = next.url;
        continue;
      }
      if (!response.ok) {
        return { ok: false, error: `Could not fetch that page (${response.status}).` };
      }

      const length = Number(response.headers.get("content-length") ?? "0");
      if (length > MAX_BYTES) {
        return { ok: false, error: "That page is too large to pull in." };
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength > MAX_BYTES) {
        return { ok: false, error: "That page is too large to pull in." };
      }

      const type = (response.headers.get("content-type") ?? "").toLowerCase();
      let text = "";
      if (type.includes("pdf") || buffer.subarray(0, 4).toString() === "%PDF") {
        const { extractPdfText } = await import("@/lib/pdf-text");
        text = await extractPdfText(buffer);
      } else {
        text = htmlToReadableExtract(buffer.toString("utf8"));
      }

      if (!text.trim()) {
        return { ok: false, error: "No readable text came back from that page." };
      }
      const clipped = text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}…` : text;
      return { ok: true, text: clipped, finalUrl: current.toString() };
    }
    return { ok: false, error: "Too many redirects." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not fetch that page.";
    return { ok: false, error: message };
  }
}

export async function enrichWithFetchedUrl(content: string): Promise<{
  prompt: string;
  fetched: boolean;
  warning: string | null;
}> {
  const urls = extractHttpUrls(content);
  const first = urls[0];
  if (!first) {
    return { prompt: content, fetched: false, warning: null };
  }

  const result = await fetchPublicPage(first);
  if (!result.ok) {
    return {
      prompt: content,
      fetched: false,
      warning: `${result.error} Working from the pasted URL and notes only.`,
    };
  }

  return {
    prompt: `${content}\n\n---\nFETCHED FROM ${result.finalUrl}\n${result.text}\n---\nUse the user's notes plus this extract. Do not invent pages that are not here.`,
    fetched: true,
    warning: null,
  };
}
