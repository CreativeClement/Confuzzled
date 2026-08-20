import { z } from "zod";

import {
  isOutputMode,
  type InputType,
  type OutputMode,
} from "@/lib/input-router";
import type { FormattedOutput } from "@/lib/output-formatter";

export const WORKSPACE_EVENT = "confuzzled-workspace";
export const PROFILE_STORAGE_KEY = "confuzzled-profile";
export const HISTORY_STORAGE_KEY = "confuzzled-history";
export const MAX_HISTORY_ITEMS = 100;

export const AUDIENCE_ROLES = [
  "electrician",
  "parent",
  "first_timer",
  "professional",
  "student",
  "other",
] as const;

export type AudienceRole = (typeof AUDIENCE_ROLES)[number];

export const AUDIENCE_ROLE_OPTIONS: readonly {
  value: AudienceRole;
  label: string;
  description: string;
}[] = [
  { value: "electrician", label: "Trades / electrician", description: "Specs, wiring notes, site instructions." },
  { value: "parent", label: "Parent / caregiver", description: "Forms, school notes, medical letters, manuals." },
  { value: "first_timer", label: "First-timer", description: "Assembly, recipes, first-time procedures." },
  { value: "professional", label: "Professional", description: "Policies, emails, contracts, process docs." },
  { value: "student", label: "Student", description: "Lecture notes, readings, exam prep." },
  { value: "other", label: "Something else", description: "Whatever has you stuck." },
] as const;

export type WorkspacePlan = "local";

export type Profile = {
  id: string;
  displayName: string;
  email: string;
  role: AudienceRole;
  defaultMode: OutputMode;
  plan: WorkspacePlan;
  createdAt: string;
  updatedAt: string;
};

export type Rating = 1 | 2 | 3 | 4 | 5 | null;
export type Comprehension = "got_it" | "partial" | "still_stuck" | null;

export type FollowUp = {
  step: number;
  content: string;
};

export type HistoryItem = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  source: string;
  sourcePreview: string;
  mode: OutputMode;
  inputType: InputType;
  result: FormattedOutput;
  rating: Rating;
  comprehension: Comprehension;
  pinned: boolean;
  checkedSteps: number[];
  followUps: FollowUp[];
};

export type HistoryPatch = Partial<
  Pick<
    HistoryItem,
    "rating" | "comprehension" | "pinned" | "title" | "result" | "mode" | "checkedSteps" | "followUps"
  >
>;

export type KeyValueStore = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

const audienceRoleSchema = z.enum(AUDIENCE_ROLES);
const outputModeSchema = z.enum([
  "tl_dr",
  "step_by_step",
  "feynman",
  "socratic",
  "visual",
  "flashcards",
]);
const inputTypeSchema = z.enum(["text", "pdf", "url", "video", "audio", "image"]);
const ratingSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.null(),
]);
const comprehensionSchema = z.union([
  z.literal("got_it"),
  z.literal("partial"),
  z.literal("still_stuck"),
  z.null(),
]);

const flashcardSchema = z.object({ front: z.string(), back: z.string() });
const stepSchema = z.object({ step: z.number(), text: z.string() });
const socraticSchema = z.object({ question: z.string(), hint: z.string() });
const mermaidSchema = z.object({ type: z.literal("mermaid"), code: z.string() });
const textSchema = z.object({ type: z.literal("text"), content: z.string() });

const formattedOutputSchema: z.ZodType<FormattedOutput> = z.union([
  mermaidSchema,
  textSchema,
  z.array(flashcardSchema),
  z.array(stepSchema),
  z.array(socraticSchema),
]);

const profileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string(),
  email: z.string(),
  role: audienceRoleSchema,
  defaultMode: outputModeSchema,
  plan: z.literal("local"),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const historyItemSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  title: z.string(),
  source: z.string(),
  sourcePreview: z.string(),
  mode: outputModeSchema,
  inputType: inputTypeSchema,
  result: formattedOutputSchema,
  rating: ratingSchema,
  comprehension: comprehensionSchema,
  pinned: z.boolean(),
  checkedSteps: z.array(z.number()).default([]),
  followUps: z.array(z.object({ step: z.number(), content: z.string() })).default([]),
});

let injectedStore: KeyValueStore | null = null;
const memoryFallback = createMemoryStore();

export function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore {
  const data: Record<string, string> = { ...initial };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] ?? null : null;
    },
    setItem(key, value) {
      data[key] = value;
    },
    removeItem(key) {
      delete data[key];
    },
  };
}

export function useWorkspaceStore(store: KeyValueStore | null): void {
  injectedStore = store;
}

function activeStore(): KeyValueStore {
  if (injectedStore) {
    return injectedStore;
  }
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return memoryFallback;
}

export function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `cz_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function isAudienceRole(value: string): value is AudienceRole {
  return (AUDIENCE_ROLES as readonly string[]).includes(value);
}

export function titleFromSource(source: string): string {
  const cleaned = source
    .replace(/\[\[input:(pdf|image|audio|video)\]\]/gi, "")
    .replace(/^Uploaded file:\s*/im, "")
    .trim();
  const line = cleaned.split(/\n/)[0]?.trim() ?? "";
  if (!line) {
    return "Untitled clarification";
  }
  return line.length > 80 ? `${line.slice(0, 77)}…` : line;
}

export function previewFromSource(source: string): string {
  const compact = source.replace(/\s+/g, " ").trim();
  if (!compact) {
    return "";
  }
  return compact.length > 160 ? `${compact.slice(0, 157)}…` : compact;
}

function nowIso(): string {
  return new Date().toISOString();
}

function notifyWorkspaceChanged(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(WORKSPACE_EVENT));
}

function readJson(key: string): unknown {
  const raw = activeStore().getItem(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    activeStore().setItem(key, JSON.stringify(value));
  } catch {
    if (key === HISTORY_STORAGE_KEY && Array.isArray(value)) {
      activeStore().setItem(key, JSON.stringify(value.slice(0, 20)));
      return;
    }
    /* Ignore quota errors on constrained browsers; in-memory fallback still holds the session. */
  }
}

export function createDefaultProfile(): Profile {
  const timestamp = nowIso();
  return {
    id: createId(),
    displayName: "Guest",
    email: "",
    role: "other",
    defaultMode: "tl_dr",
    plan: "local",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function readProfile(): Profile | null {
  const parsed = profileSchema.safeParse(readJson(PROFILE_STORAGE_KEY));
  return parsed.success ? parsed.data : null;
}

export function ensureProfile(): Profile {
  const existing = readProfile();
  if (existing) {
    return existing;
  }
  const created = createDefaultProfile();
  writeJson(PROFILE_STORAGE_KEY, created);
  notifyWorkspaceChanged();
  return created;
}

export function saveProfile(patch: Partial<Omit<Profile, "id" | "createdAt" | "plan">>): Profile {
  const current = ensureProfile();
  const next: Profile = {
    ...current,
    displayName: patch.displayName?.trim() || current.displayName,
    email: patch.email !== undefined ? patch.email.trim() : current.email,
    role: patch.role ?? current.role,
    defaultMode: patch.defaultMode && isOutputMode(patch.defaultMode) ? patch.defaultMode : current.defaultMode,
    updatedAt: nowIso(),
  };
  writeJson(PROFILE_STORAGE_KEY, next);
  notifyWorkspaceChanged();
  return next;
}

export function readHistory(): HistoryItem[] {
  const raw = readJson(HISTORY_STORAGE_KEY);
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item) => historyItemSchema.safeParse(item))
    .filter((item): item is z.SafeParseSuccess<HistoryItem> => item.success)
    .map((item) => item.data)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function getHistoryItem(id: string): HistoryItem | null {
  return readHistory().find((item) => item.id === id) ?? null;
}

export type NewHistoryInput = {
  source: string;
  mode: OutputMode;
  inputType: InputType;
  result: FormattedOutput;
};

export function addHistoryItem(input: NewHistoryInput): HistoryItem {
  const timestamp = nowIso();
  const source = input.source.trim();
  const item: HistoryItem = {
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    title: titleFromSource(source),
    source,
    sourcePreview: previewFromSource(source),
    mode: input.mode,
    inputType: input.inputType,
    result: input.result,
    rating: null,
    comprehension: null,
    pinned: false,
    checkedSteps: [],
    followUps: [],
  };
  const next = [item, ...readHistory()].slice(0, MAX_HISTORY_ITEMS);
  writeJson(HISTORY_STORAGE_KEY, next);
  notifyWorkspaceChanged();
  return item;
}

export function updateHistoryItem(id: string, patch: HistoryPatch): HistoryItem | null {
  const items = readHistory();
  const index = items.findIndex((item) => item.id === id);
  if (index < 0) {
    return null;
  }
  const current = items[index];
  if (!current) {
    return null;
  }
  const nextItem: HistoryItem = {
    ...current,
    ...patch,
    updatedAt: nowIso(),
  };
  const next = [...items];
  next[index] = nextItem;
  writeJson(HISTORY_STORAGE_KEY, next);
  notifyWorkspaceChanged();
  return nextItem;
}

export function deleteHistoryItem(id: string): boolean {
  const items = readHistory();
  const next = items.filter((item) => item.id !== id);
  if (next.length === items.length) {
    return false;
  }
  writeJson(HISTORY_STORAGE_KEY, next);
  notifyWorkspaceChanged();
  return true;
}

export function clearWorkspace(): void {
  const store = activeStore();
  store.removeItem(PROFILE_STORAGE_KEY);
  store.removeItem(HISTORY_STORAGE_KEY);
  notifyWorkspaceChanged();
}

export type WorkspaceExport = {
  version: 1;
  exportedAt: string;
  profile: Profile;
  history: HistoryItem[];
};

const exportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  profile: profileSchema,
  history: z.array(historyItemSchema),
});

export function exportWorkspace(): WorkspaceExport {
  return {
    version: 1,
    exportedAt: nowIso(),
    profile: ensureProfile(),
    history: readHistory(),
  };
}

export function importWorkspace(raw: string): { ok: true } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, error: "That file is not valid JSON." };
  }

  const result = exportSchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, error: "That export does not match a Confuzzle workspace file." };
  }

  writeJson(PROFILE_STORAGE_KEY, result.data.profile);
  writeJson(HISTORY_STORAGE_KEY, result.data.history.slice(0, MAX_HISTORY_ITEMS));
  notifyWorkspaceChanged();
  return { ok: true };
}

export function searchHistory(
  items: HistoryItem[],
  query: string,
): HistoryItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return items;
  }
  return items.filter((item) => {
    return (
      item.title.toLowerCase().includes(needle) ||
      item.sourcePreview.toLowerCase().includes(needle) ||
      item.source.toLowerCase().includes(needle)
    );
  });
}

export function workspaceStats(items: HistoryItem[]): {
  total: number;
  pinned: number;
  rated: number;
  gotIt: number;
  byMode: Record<OutputMode, number>;
} {
  const byMode: Record<OutputMode, number> = {
    tl_dr: 0,
    step_by_step: 0,
    feynman: 0,
    socratic: 0,
    visual: 0,
    flashcards: 0,
  };
  let pinned = 0;
  let rated = 0;
  let gotIt = 0;
  for (const item of items) {
    byMode[item.mode] += 1;
    if (item.pinned) {
      pinned += 1;
    }
    if (item.rating) {
      rated += 1;
    }
    if (item.comprehension === "got_it") {
      gotIt += 1;
    }
  }
  return { total: items.length, pinned, rated, gotIt, byMode };
}
