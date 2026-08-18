"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Sparkles } from "lucide-react";

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
    <header className="border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="container flex min-h-16 items-center justify-between gap-3 py-3">
        <Link href="/" className="flex min-h-12 items-center gap-2 font-semibold tracking-tight">
          <span
            aria-hidden="true"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm text-primary-foreground"
          >
            Cz
          </span>
          <span>
            Confuzzled
            <span className="ml-2 hidden text-xs font-normal text-muted-foreground sm:inline">
              for anyone stuck
            </span>
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
    </header>
  );
}
