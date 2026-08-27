import { ShieldAlert } from "lucide-react";

import type { SafetyNotice } from "@/lib/safety";

export function SafetyStrip({ notice }: { notice: SafetyNotice }) {
  return (
    <aside
      className="flex gap-3 rounded-[1.5rem] border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm leading-relaxed text-amber-950 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] backdrop-blur-sm dark:text-amber-100"
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
