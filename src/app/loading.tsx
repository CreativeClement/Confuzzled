import { BrandLogo, LogoHalo } from "@/components/BrandLogo";

export default function Loading() {
  return (
    <main id="main" className="container flex flex-col items-center py-20 text-center">
      <LogoHalo>
        <BrandLogo size={48} glow />
      </LogoHalo>
      <p className="kicker mt-5 inline-flex items-center gap-2">
        <span className="pulse-dot" aria-hidden="true" />
        Loading Confuzzle…
      </p>
    </main>
  );
}
