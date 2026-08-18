import type { InputType, OutputMode } from "@/lib/input-router";
import type { FormattedOutput } from "@/lib/output-formatter";

export const SAMPLE_SOURCE = `Breaker panel note from the site:

Left bank, third from top, is the kitchen small-appliance circuit. It tripped twice today. Label is faded. Before you reset it: confirm the toaster and the kettle were not on the same outlet strip. If it trips again with nothing plugged in, stop and call a licensed electrician. Do not bypass the breaker.`;

export const SAMPLE_MODE: OutputMode = "step_by_step";
export const SAMPLE_INPUT_TYPE: InputType = "text";

export const SAMPLE_RESULT: FormattedOutput = [
  {
    step: 1,
    text: "Do not reset yet. Unplug the toaster, kettle, and any strip on that kitchen circuit.",
  },
  {
    step: 2,
    text: "Find the left bank, third breaker from the top — the faded kitchen small-appliance label.",
  },
  {
    step: 3,
    text: "Reset that breaker once. If it stays on with nothing plugged in, plug appliances in one at a time.",
  },
  {
    step: 4,
    text: "If it trips again with nothing plugged in, stop. Call a licensed electrician. Do not bypass the breaker.",
  },
];
