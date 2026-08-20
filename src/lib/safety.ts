export const SAFETY_KINDS = [
  "electrical",
  "gas",
  "medical",
  "legal",
  "structural",
  "heights",
] as const;

export type SafetyKind = (typeof SAFETY_KINDS)[number];

export type SafetyNotice = {
  kind: SafetyKind;
  label: string;
  verifier: string;
  message: string;
};

const RULES: readonly {
  kind: SafetyKind;
  label: string;
  verifier: string;
  pattern: RegExp;
}[] = [
  {
    kind: "electrical",
    label: "Electrical",
    verifier: "a licensed electrician",
    pattern: /\b(breaker|circuit|outlet|volt(?:age)?|amp(?:s|ere)?|wiring|live wire|electrical|panel)\b/i,
  },
  {
    kind: "gas",
    label: "Gas",
    verifier: "a licensed gas fitter",
    pattern: /\b(gas line|propane|natural gas|carbon monoxide|shutoff valve)\b/i,
  },
  {
    kind: "medical",
    label: "Medical",
    verifier: "a clinician who knows this case",
    pattern: /\b(dosage|prescription|diagnos(?:is|e)|symptom|medication|mg\b|medical)\b/i,
  },
  {
    kind: "legal",
    label: "Legal / official",
    verifier: "a qualified professional for this document",
    pattern: /\b(contract|lawsuit|hereby|statutory|eviction|insurance claim|liable)\b/i,
  },
  {
    kind: "structural",
    label: "Structural",
    verifier: "a licensed contractor or engineer",
    pattern: /\b(load-bearing|foundation|structural|joist|bearing wall)\b/i,
  },
  {
    kind: "heights",
    label: "Heights",
    verifier: "someone trained for work at height",
    pattern: /\b(scaffold|harness|fall arrest|roof work|extension ladder)\b/i,
  },
];

export function detectSafetyNotice(source: string): SafetyNotice | null {
  const text = source.trim();
  if (!text) {
    return null;
  }
  for (const rule of RULES) {
    if (rule.pattern.test(text)) {
      return {
        kind: rule.kind,
        label: rule.label,
        verifier: rule.verifier,
        message: `${rule.label}. We only use what’s in your source — no invented ratings, voltages, or steps. Have ${rule.verifier} verify before you act.`,
      };
    }
  }
  return null;
}
