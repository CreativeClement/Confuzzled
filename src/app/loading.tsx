import { BrandLogo } from "@/components/BrandLogo";

export default function Loading() {
  return (
    <main id="main" className="container flex flex-col items-center py-20 text-center">
      <BrandLogo size={48} glow />
      <p className="mt-5 text-sm text-muted-foreground">Loading…</p>
    </main>
  );
}
