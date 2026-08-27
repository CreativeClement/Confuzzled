import type { ReactNode } from "react";

import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";

export function MarketingPage({
  kicker,
  title,
  children,
  actions,
  center = false,
}: {
  kicker?: string;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  center?: boolean;
}) {
  return (
    <main id="main" className="container max-w-2xl py-12 sm:py-16">
      <div className={cn("fade-up", center && "text-center")}>
        <div className={cn("logo-halo mb-6 inline-flex", center && "mx-auto")}>
          <BrandLogo size={56} glow />
        </div>
        {kicker ? <p className="kicker">{kicker}</p> : null}
        <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight">{title}</h1>
      </div>
      <div
        className={cn(
          "surface-card mt-8 space-y-4 p-6 text-base leading-relaxed text-muted-foreground hover:transform-none hover:border-border/70 sm:p-8",
          center && "mx-auto text-center",
        )}
      >
        {children}
      </div>
      {actions ? (
        <div className={cn("mt-8 flex flex-wrap gap-3", center && "justify-center")}>{actions}</div>
      ) : null}
    </main>
  );
}
