"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, History, Home, Settings2 } from "lucide-react";

import { useWorkspace } from "@/components/WorkspaceProvider";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: Home, exact: true },
  { href: "/dashboard/history", label: "History", icon: History, exact: false },
  { href: "/dashboard/saved", label: "Pinned", icon: Bookmark, exact: false },
  { href: "/dashboard/settings", label: "Settings", icon: Settings2, exact: false },
] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, profile } = useWorkspace();

  return (
    <div className="container flex flex-1 flex-col gap-6 py-8 lg:flex-row">
      <aside className="lg:w-60">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Workspace</p>
          <p className="truncate text-base font-semibold">
            {ready ? profile?.displayName || "Guest" : "Loading…"}
          </p>
          <p className="text-xs text-muted-foreground">Stays on this device</p>
        </div>
        <nav aria-label="Dashboard" className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/70 text-secondary-foreground hover:bg-secondary",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
