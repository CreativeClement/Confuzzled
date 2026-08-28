import { BrandLogo, LogoHalo } from "@/components/BrandLogo";

export default function Loading() {
  return (
    <main id="main" className="container flex flex-col items-center py-20 text-center">
      <LogoHalo>
        <BrandLogo size={48} />
      </LogoHalo>
      <p className="mt-5 text-sm text-muted-foreground">Loading Confuzzle…</p>
    </main>
  );
}
