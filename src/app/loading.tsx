import { BrandLogo } from "@/components/BrandLogo";

export default function Loading() {
  return (
    <main id="main" className="container flex flex-col items-center py-20 text-center">
      <div className="logo-halo">
        <BrandLogo size={48} glow />
      </div>
      <p className="kicker mt-6">Confuzzle</p>
      <p className="mt-2 text-sm text-muted-foreground">Loading Confuzzle…</p>
    </main>
  );
}
