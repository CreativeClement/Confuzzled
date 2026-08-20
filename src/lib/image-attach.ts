import type { ClarifyImageMime } from "@/lib/image-payload";

export type AttachedImage = {
  name: string;
  mime: ClarifyImageMime;
  data: string;
  preview: string;
};

const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.72;
const MAX_BASE64_CHARS = 1_200_000;

function dataUrlToAttached(name: string, dataUrl: string): AttachedImage {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/i);
  if (!match?.[1] || !match[2]) {
    throw new Error("That photo could not be read. Type the words you can see instead.");
  }
  if (match[2].length > MAX_BASE64_CHARS) {
    throw new Error("That photo is too large. Crop it or type the words you can read.");
  }
  return {
    name,
    mime: match[1].toLowerCase() as ClarifyImageMime,
    data: match[2],
    preview: dataUrl,
  };
}

export async function fileToClarifyImage(file: File): Promise<AttachedImage> {
  const looksLikeImage =
    file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|avif)$/i.test(file.name);
  if (!looksLikeImage) {
    throw new Error("That does not look like a photo.");
  }

  if (typeof createImageBitmap === "function" && typeof document !== "undefined") {
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        bitmap.close();
        throw new Error("Could not read that photo.");
      }
      context.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();
      return dataUrlToAttached(file.name, canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("That photo")) {
        throw error;
      }
      /* Fall through to the raw file reader for formats the canvas cannot compress. */
    }
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read that photo."));
    reader.readAsDataURL(file);
  });

  return dataUrlToAttached(file.name, dataUrl);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(file.name);
}
