"use client";

import { OUTPUT_MODE_OPTIONS, type OutputMode } from "@/lib/input-router";
import { cn } from "@/lib/utils";

export function LensSwitch({
  value,
  recommended,
  onChange,
  disabled,
}: {
  value: OutputMode;
  recommended?: OutputMode;
  onChange: (mode: OutputMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2 print:hidden">
      <p className="kicker tracking-wide">Lens</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Switch how this is explained">
        {OUTPUT_MODE_OPTIONS.map((option) => {
          const active = option.value === value;
          const picked = option.value === recommended;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={cn(
                "inline-flex min-h-12 items-center rounded-full border px-4 text-sm font-medium transition-colors",
                active
                  ? "border-transparent bg-gradient-to-r from-violet-600 to-cyan-600 text-white"
                  : "border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {option.label}
              {picked && !active ? (
                <span className="ml-2 text-xs font-normal opacity-70">for this</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
