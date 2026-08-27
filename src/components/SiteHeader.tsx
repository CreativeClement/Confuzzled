"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sparkles } from "lucide-react";

import { BrandWordmark } from "@/components/BrandLogo";
import { HelpSheet } from "@/components/HelpSheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { ready, profile, history } = useWorkspace();
  const onDashboard = pathname.startsWith("/dashboard");

  return (
    <header className="sticky top-0 z-40 print:hidden">
      <div className="container pt-3">
        <div className="glass-nav relative flex min-h-16 items-center justify-between gap-3 px-3 py-2 sm:px-4">
          <div
            aria-hidden="true"
            className="hairline-gradient pointer-events-none absolute inset-x-4 bottom-0"
          />
          <Link href="/" className="flex min-h-12 items-center font-semibold tracking-tight">
            <BrandWordmark size={36} />
            <span className="ml-2 hidden text-xs font-normal text-muted-foreground sm:inline">
              for the confuzzled
            </span>
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-2">
            <Button asChild variant={pathname === "/" ? "secondary" : "ghost"} className="hidden sm:inline-flex">
              <Link href="/#workspace">
                <Sparkles aria-hidden="true" />
                Unconfuzzle
              </Link>
            </Button>
            <Button asChild variant={onDashboard ? "secondary" : "ghost"}>
              <Link href="/dashboard" className={cn(onDashboard && "font-semibold")}>
                <LayoutDashboard aria-hidden="true" />
                Dashboard
                {ready && history.length > 0 ? (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-foreground">
                    {history.length}
                  </span>
                ) : null}
              </Link>
            </Button>
            {ready && profile && profile.displayName !== "Guest" ? (
              <span className="hidden max-w-[8rem] truncate text-sm text-muted-foreground md:inline">
                {profile.displayName}
              </span>
            ) : null}
            <HelpSheet />
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
