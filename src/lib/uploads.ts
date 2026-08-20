import { byokHeaders, readByok } from "@/lib/byok";

export async function extractPdfUpload(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/extract", { method: "POST", body });
  const payload = (await response.json()) as { success: boolean; text?: string | null; error?: string };
  if (!payload.success || !payload.text) {
    throw new Error(payload.error || "Could not read that PDF.");
  }
  return payload.text;
}

export async function transcribeAudioUpload(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  const response = await fetch("/api/transcribe", {
    method: "POST",
    headers: byokHeaders(typeof window === "undefined" ? null : readByok(window.localStorage)),
    body,
  });
  const payload = (await response.json()) as { success: boolean; text?: string | null; error?: string };
  if (!payload.success || !payload.text) {
    throw new Error(payload.error || "Could not hear that recording.");
  }
  return payload.text;
}

export function markerForFile(file: File): string | null {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return "[[input:pdf]]";
  }
  if (file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i.test(name)) {
    return "[[input:image]]";
  }
  if (file.type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg|flac)$/i.test(name)) {
    return "[[input:audio]]";
  }
  if (file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(name)) {
    return "[[input:video]]";
  }
  return null;
}

export async function readUploadedFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    try {
      return await extractPdfUpload(file);
    } catch {
      return `[[input:pdf]]\nUploaded file: ${file.name}. No selectable text could be extracted. Paste the pages you need.`;
    }
  }

  const marker = markerForFile(file);
  if (marker === "[[input:audio]]") {
    try {
      return await transcribeAudioUpload(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not hear that recording.";
      return `[[input:audio]]\nUploaded file: ${file.name}. ${message} Paste the words you can hear.`;
    }
  }
  if (marker === "[[input:video]]") {
    return `[[input:video]]\nVideo: ${file.name}. We cannot play the file. Paste a transcript or the part that has you stuck.`;
  }
  if (marker === "[[input:image]]") {
    return `${marker}\nPhoto: ${file.name}. Add any extra notes. Visible text on the photo is sent with Confuzzle.`;
  }
  if (marker) {
    return `${marker}\nUploaded file: ${file.name} (${file.type || "unknown"}, ${file.size} bytes).\nAdd a transcript or notes. Do not invent what is not here.`;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? reader.result : "");
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read that file."));
    reader.readAsText(file);
  });
}
