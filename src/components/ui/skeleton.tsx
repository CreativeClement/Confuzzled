import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-muted/80 ring-1 ring-border/40", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
