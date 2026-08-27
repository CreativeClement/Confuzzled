import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  size?: number;
  className?: string;
  glow?: boolean;
};

export function BrandLogo({ size = 40, className, glow = false }: BrandLogoProps) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={cn("shrink-0", glow && "logo-glow", className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-hook`} x1="18%" y1="8%" x2="72%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="48%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="28" fill="#000000" />
      <path
        d="M78 40 A34 34 0 1 0 78 92"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="11"
        strokeLinecap="round"
      />
      <rect x="46" y="57" width="8" height="18" rx="4" fill="#FFFFFF" />
      <rect x="60" y="57" width="8" height="18" rx="4" fill="#FFFFFF" />
      <path
        d="M80 38 C108 30 118 58 97 80"
        fill="none"
        stroke={`url(#${uid}-hook)`}
        strokeWidth="11"
        strokeLinecap="round"
      />
      <circle cx="64" cy="104" r="6.5" fill="#22D3EE" />
      <rect
        x="74"
        y="16"
        width="5"
        height="15"
        rx="2.5"
        fill="#C084FC"
        transform="rotate(-38 76.5 23.5)"
      />
      <rect
        x="86"
        y="14"
        width="5"
        height="15"
        rx="2.5"
        fill="#6366F1"
        transform="rotate(-10 88.5 21.5)"
      />
      <rect
        x="97"
        y="18"
        width="5"
        height="15"
        rx="2.5"
        fill="#22D3EE"
        transform="rotate(20 99.5 25.5)"
      />
    </svg>
  );
}

export function LogoHalo({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={cn("logo-halo", className)}>{children}</span>;
}

export function BrandWordmark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoHalo>
        <BrandLogo size={size} />
      </LogoHalo>
      <span className="font-semibold tracking-tight">Confuzzle</span>
    </span>
  );
}
