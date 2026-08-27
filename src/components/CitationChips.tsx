import { Badge } from "@/components/ui/badge";

export function CitationChips({ citations }: { citations: string[] }) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <section aria-label="Phrases taken from your source" className="space-y-2">
      <p className="kicker tracking-wide">From your source</p>
      <ul className="flex flex-wrap gap-2">
        {citations.map((citation) => (
          <li key={citation}>
            <Badge variant="accent" className="max-w-full whitespace-normal text-left font-normal leading-snug">
              {citation}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
