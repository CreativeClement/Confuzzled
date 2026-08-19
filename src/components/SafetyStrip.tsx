import { ShieldAlert } from "lucide-react";

import type { SafetyNotice } from "@/lib/safety";

export function SafetyStrip({ notice }: { notice: SafetyNotice }) {
  return (
    <aside
      className="flex gap-3 rounded-2xl border border-accent-foreground/20 bg-accent/60 px-4 py-4 text-sm leading-relaxed text-accent-foreground"
      role="note"
    >
      <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-semibold">{notice.label}.</span> We only use what’s in your source — no
        invented ratings, voltages, or steps. Have {notice.verifier} verify before you act.
      </p>
    </aside>
  );
}
