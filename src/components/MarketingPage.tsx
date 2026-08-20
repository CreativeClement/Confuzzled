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
      <div className={cn(center && "text-center")}>
        <div className={cn("mb-6 w-fit animate-float", center && "mx-auto")}>
          <BrandLogo size={56} glow />
        </div>
        {kicker ? (
          <p className="animate-fade-up text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">{kicker}</p>
        ) : null}
        <h1 className="mt-2 animate-fade-up text-balance text-4xl font-semibold tracking-tight [animation-delay:80ms]">{title}</h1>
      </div>
      <div
        className={cn(
          "mt-6 space-y-4 text-base leading-relaxed text-muted-foreground",
          center && "mx-auto",
        )}
      >
        {children}
      </div>
      {actions ? <div className={cn("mt-8 flex flex-wrap gap-3", center && "justify-center")}>{actions}</div> : null}
    </main>
  );
}
