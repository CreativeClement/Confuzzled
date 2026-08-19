import type { InputType, OutputMode } from "@/lib/input-router";
import type { FormattedOutput } from "@/lib/output-formatter";

export type ClarifySuccess = {
  success: true;
  data: FormattedOutput;
  mode: OutputMode;
  inputType: InputType;
};

export type ClarifyFailure = {
  success: false;
  error: string;
  data: null;
};

export type ClarifyResponse = ClarifySuccess | ClarifyFailure;

export async function requestClarify(input: {
  content: string;
  mode: OutputMode | "auto";
  role?: string;
  focus?: { step: number; text: string };
}): Promise<ClarifyResponse> {
  const response = await fetch("/api/clarify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return (await response.json()) as ClarifyResponse;
}
