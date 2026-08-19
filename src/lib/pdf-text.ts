import { extractText } from "unpdf";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const extracted = await extractText(new Uint8Array(buffer), { mergePages: true });
  return extracted.text.replace(/\s+/g, " ").trim();
}
