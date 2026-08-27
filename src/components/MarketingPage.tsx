import type { ReactNode } from "react";

import { BrandLogo, LogoHalo } from "@/components/BrandLogo";
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
        <LogoHalo className={cn("mb-6", center && "flex mx-auto")}>
          <BrandLogo size={56} glow />
        </LogoHalo>
        {kicker ? <p className="kicker">{kicker}</p> : null}
        <h1 className="mt-2 text-balance text-4xl font-semibold tracking-tight">{title}</h1>
      </div>
      <div
        className={cn(
          "surface-card-static mt-6 space-y-4 p-6 text-base leading-relaxed text-muted-foreground sm:p-8",
          center && "mx-auto",
        )}
      >
        {children}
      </div>
      {actions ? <div className={cn("mt-8 flex flex-wrap gap-3", center && "justify-center")}>{actions}</div> : null}
    </main>
  );
}
