import net from "node:net";

const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal", "metadata.google.com"]);

export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) {
    return true;
  }
  if (a === 169 && b === 254) {
    return true;
  }
  if (a === 172 && b !== undefined && b >= 16 && b <= 31) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  return false;
}

export function isPrivateIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 4) {
    return isPrivateIPv4(ip);
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped?.[1]) {
      return isPrivateIPv4(mapped[1]);
    }
    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80")
    );
  }
  return false;
}

export function parsePublicHttpUrl(raw: string): { ok: true; url: URL } | { ok: false; error: string } {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return { ok: false, error: "That URL is not valid." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Only http and https URLs can be fetched." };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: "URLs with usernames or passwords are blocked." };
  }

  const host = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return { ok: false, error: "That host cannot be fetched." };
  }
  if (net.isIP(host) && isPrivateIp(host)) {
    return { ok: false, error: "Private network addresses cannot be fetched." };
  }

  return { ok: true, url: parsed };
}

export function extractHttpUrls(content: string): string[] {
  const matches = content.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
  return matches.map((value) => value.replace(/[),.;]+$/g, ""));
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function firstMatch(html: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    const value = match?.[1]?.trim();
    if (value) {
      return htmlToPlainText(value);
    }
  }
  return "";
}

export function htmlToReadableExtract(html: string): string {
  const title = firstMatch(html, [/<title[^>]*>([\s\S]*?)<\/title>/i]);
  const description = firstMatch(html, [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
  ]);
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<(nav|header|footer|aside|form)[\s\S]*?<\/\1>/gi, " ");
  const body = htmlToPlainText(stripped);
  return [title, description, body].filter(Boolean).join("\n\n");
}
