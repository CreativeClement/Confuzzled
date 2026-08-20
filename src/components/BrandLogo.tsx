import { useId } from "react";

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
        <linearGradient id={`${uid}-tile`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#2C2C30" />
          <stop offset="100%" stopColor="#161618" />
        </linearGradient>
        <linearGradient id={`${uid}-face`} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EBEBF0" />
        </linearGradient>
        <linearGradient id={`${uid}-hook`} x1="8%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%" stopColor="#C86DFF" />
          <stop offset="45%" stopColor="#6F7BF8" />
          <stop offset="100%" stopColor="#2E9BFF" />
        </linearGradient>
        <linearGradient id={`${uid}-s1`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C86DFF" />
          <stop offset="100%" stopColor="#8E79F8" />
        </linearGradient>
        <linearGradient id={`${uid}-s2`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5A8BFF" />
          <stop offset="100%" stopColor="#4FC3FF" />
        </linearGradient>
        <linearGradient id={`${uid}-s3`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4AA5FF" />
          <stop offset="100%" stopColor="#35D0FF" />
        </linearGradient>
      </defs>

      <rect width="128" height="128" rx="29" fill={`url(#${uid}-tile)`} />

      <path
        d="M78.1 39.7A33.8 33.8 0 1 0 78.1 89.9"
        fill="none"
        stroke={`url(#${uid}-face)`}
        strokeWidth="12.4"
        strokeLinecap="round"
      />

      <rect x="48.9" y="58.7" width="4.9" height="14.8" rx="2.45" fill="#FFFFFF" className="logo-eye" />
      <rect x="65" y="58.7" width="4.9" height="14.8" rx="2.45" fill="#FFFFFF" className="logo-eye" />

      <path
        d="M82.5 70.5C82 62.5 90 58.5 96 62c6 3.5 6.5 12 0 17-5 4-7.5 7.5-8 13"
        fill="none"
        stroke={`url(#${uid}-hook)`}
        strokeWidth="11.5"
        strokeLinecap="round"
      />

      <circle cx="83.5" cy="106.5" r="5.7" fill="#2BB4FF" className="logo-dot" />

      <rect
        x="78.1"
        y="16.5"
        width="4.4"
        height="16"
        rx="2.2"
        fill={`url(#${uid}-s1)`}
        className="logo-spark"
      />
      <rect
        x="93.6"
        y="23.5"
        width="4.4"
        height="15"
        rx="2.2"
        fill={`url(#${uid}-s2)`}
        className="logo-spark logo-spark-2"
        transform="rotate(47 95.8 31)"
      />
      <rect
        x="99.7"
        y="38.8"
        width="4.4"
        height="14"
        rx="2.2"
        fill={`url(#${uid}-s3)`}
        className="logo-spark logo-spark-3"
        transform="rotate(90 101.9 45.8)"
      />
    </svg>
  );
}

export function BrandWordmark({
  size = 36,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.03]", className)}>
      <BrandLogo size={size} />
      <span className="font-semibold tracking-tight">Confuzzle</span>
    </span>
  );
}
