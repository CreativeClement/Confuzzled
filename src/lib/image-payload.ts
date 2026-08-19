export const CLARIFY_IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export type ClarifyImageMime = (typeof CLARIFY_IMAGE_MIMES)[number];

export type ClarifyImage = {
  mime: ClarifyImageMime;
  data: string;
};

const MAX_BASE64_CHARS = 1_200_000;
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

function isClarifyImageMime(value: string): value is ClarifyImageMime {
  return (CLARIFY_IMAGE_MIMES as readonly string[]).includes(value);
}

export function parseClarifyImage(value: unknown): { ok: true; image: ClarifyImage } | { ok: false; error: string } | null {
  if (value == null) {
    return null;
  }
  if (typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Image must be an object with mime and data." };
  }

  const record = value as Record<string, unknown>;
  const mime = typeof record.mime === "string" ? record.mime.toLowerCase() : "";
  const data = typeof record.data === "string" ? record.data.replace(/\s+/g, "") : "";

  if (!isClarifyImageMime(mime)) {
    return { ok: false, error: "Photos must be JPEG, PNG, WebP, or GIF." };
  }
  if (!data || data.length > MAX_BASE64_CHARS) {
    return { ok: false, error: "That photo is too large. Crop it or type the words you can read." };
  }
  if (!BASE64_PATTERN.test(data) || data.length % 4 !== 0) {
    return { ok: false, error: "That photo could not be read. Try another image or type the words." };
  }

  return { ok: true, image: { mime, data } };
}

export function clarifyImageToBuffer(image: ClarifyImage): Buffer {
  return Buffer.from(image.data, "base64");
}
