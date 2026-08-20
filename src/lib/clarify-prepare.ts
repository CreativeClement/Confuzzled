import { citationsFromOutput } from "@/lib/citations";
import { enrichWithFetchedUrl } from "@/lib/fetch-public";
import { parseClarifyImage, type ClarifyImage } from "@/lib/image-payload";
import {
  buildSystemPrompt,
  detectInputType,
  isOutputMode,
  type InputType,
  type OutputMode,
} from "@/lib/input-router";
import { buildFocusPrompt, recommendOutputMode } from "@/lib/lens";
import type { FormattedOutput } from "@/lib/output-formatter";
import { AUDIENCE_ROLE_OPTIONS, isAudienceRole } from "@/lib/workspace";

export const MAX_INPUT_CHARS = 4000;
export const MAX_OUTPUT_TOKENS = 1000;
export const COMPLETION_TIMEOUT_MS = 25_000;

export type ClarifyFocus = {
  step: number;
  text: string;
};

export type ClarifyPrep = {
  mode: OutputMode;
  inputType: InputType;
  system: string;
  prompt: string;
  image: ClarifyImage | null;
  truncated: boolean;
  fetched: boolean;
  fetchWarning: string | null;
  workingSource: string;
};

export type ClarifyPrepFailure = {
  status: number;
  error: string;
  mode: string | null;
  inputType: InputType | null;
};

export async function prepareClarify(input: {
  content: string;
  mode?: string;
  role?: string;
  focus?: ClarifyFocus;
  image?: unknown;
}): Promise<{ ok: true; prep: ClarifyPrep } | { ok: false; failure: ClarifyPrepFailure }> {
  const imageParsed = parseClarifyImage(input.image);
  if (imageParsed && !imageParsed.ok) {
    return {
      ok: false,
      failure: {
        status: 400,
        error: imageParsed.error,
        mode: null,
        inputType: "image",
      },
    };
  }
  const image = imageParsed?.ok ? imageParsed.image : null;
  const content = input.content.trim();
  const focus = input.focus;
  const requestedMode = input.mode ?? (focus ? "feynman" : "auto");
  let mode: OutputMode;
  if (focus) {
    mode = "feynman";
  } else if (requestedMode === "auto") {
    mode = recommendOutputMode(content);
  } else if (isOutputMode(requestedMode)) {
    mode = requestedMode;
  } else {
    return {
      ok: false,
      failure: {
        status: 400,
        error: "Mode must be one of: auto, TL;DR, Step-by-Step, Feynman, Socratic, Visual, Flashcards.",
        mode: requestedMode,
        inputType: null,
      },
    };
  }

  if (!content) {
    return {
      ok: false,
      failure: {
        status: 400,
        error: "Paste or upload something to unconfuzzle.",
        mode,
        inputType: null,
      },
    };
  }

  const truncated = content.length > MAX_INPUT_CHARS;
  const promptSource = truncated ? content.slice(0, MAX_INPUT_CHARS) : content;
  const inputType = image ? "image" : detectInputType(promptSource);
  let workingSource = promptSource;
  let fetched = false;
  let fetchWarning: string | null = null;
  if (inputType === "url" && !focus) {
    const enriched = await enrichWithFetchedUrl(promptSource);
    workingSource = enriched.prompt.slice(0, MAX_INPUT_CHARS + 3_200);
    fetched = enriched.fetched;
    fetchWarning = enriched.warning;
  }
  const prompt = focus ? buildFocusPrompt(workingSource, focus.step, focus.text) : workingSource;
  const role = input.role && isAudienceRole(input.role) ? input.role : null;
  const roleMeta = role ? AUDIENCE_ROLE_OPTIONS.find((option) => option.value === role) : null;
  const system = [
    buildSystemPrompt(mode, inputType),
    roleMeta
      ? `READER: ${roleMeta.label}. ${roleMeta.description} Prefer examples and vocabulary that fit that life. Do not assume they are a student.`
      : "",
    focus
      ? `FOCUS: The reader is stuck on step ${focus.step}. Teach only that step. Do not invent tools, voltages, dosages, or legal outcomes.`
      : "",
    image
      ? "A photograph is attached as pixels. Read visible text. If a label is blurry, say you cannot read it. Do not invent serials, voltages, dosages, or legal outcomes."
      : "",
    fetched
      ? "A public page was fetched and appended as an extract. Stay faithful to that extract plus the user's notes."
      : "",
    fetchWarning ? `FETCH NOTE: ${fetchWarning}` : "",
    truncated
      ? `The user input was truncated to ${MAX_INPUT_CHARS} characters for token safety. Work only from what remains.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    ok: true,
    prep: {
      mode,
      inputType,
      system,
      prompt,
      image,
      truncated,
      fetched,
      fetchWarning,
      workingSource,
    },
  };
}

export function successPayload(
  prep: ClarifyPrep,
  data: FormattedOutput,
): Record<string, unknown> {
  return {
    success: true,
    data,
    mode: prep.mode,
    inputType: prep.inputType,
    truncated: prep.truncated,
    fetched: prep.fetched,
    seen: Boolean(prep.image),
    warning: prep.fetchWarning,
    citations: citationsFromOutput(prep.workingSource, data, prep.mode),
  };
}

export function failurePayload(
  failure: ClarifyPrepFailure,
): Record<string, unknown> {
  return {
    success: false,
    error: failure.error,
    data: null,
    mode: failure.mode,
    inputType: failure.inputType,
  };
}
