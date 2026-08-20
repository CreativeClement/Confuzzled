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
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl print:hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[length:200%_100%] bg-gradient-to-r from-violet-500/0 via-violet-400/80 to-cyan-400/0 animate-hairline-run"
      />
      <div className="container flex min-h-16 items-center justify-between gap-3 py-3">
        <Link href="/" className="flex min-h-12 items-center font-semibold tracking-tight">
          <BrandWordmark size={36} />
          <span className="ml-2 hidden text-xs font-normal text-muted-foreground sm:inline">
            Clarity, on demand
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-2">
          <Button asChild variant={pathname === "/" ? "secondary" : "ghost"} className="hidden sm:inline-flex">
            <Link href="/#workspace">
              <Sparkles aria-hidden="true" className="animate-twinkle" />
              Confuzzle this
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
    </header>
  );
}
