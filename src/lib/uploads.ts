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

export function readUploadedFile(file: File): Promise<string> {
  const marker = markerForFile(file);
  if (marker) {
    return Promise.resolve(
      `${marker}\nUploaded file: ${file.name} (${file.type || "unknown"}, ${file.size} bytes).\nClarify from the filename and any additional pasted context.`,
    );
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
