"use client";

import { useEffect, useRef, useState } from "react";
import { KeyRound } from "lucide-react";

import { ProviderKeyForm } from "@/components/ProviderKeyForm";
import { Button } from "@/components/ui/button";
import { requestHealth } from "@/lib/clarify-client";
import { readByok } from "@/lib/byok";

/**
 * Confuzzle cannot answer anything without a key somewhere. Say so before the
 * reader types a wall of text, and open on demand when a request comes back
 * asking for one.
 */
export function KeySetupPanel({
  demanded = false,
  onConnected,
}: {
  /** A request just failed because no key was available. */
  demanded?: boolean;
  onConnected?: () => void;
}) {
  const [needsKey, setNeedsKey] = useState(false);
  const [open, setOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    const evaluate = async () => {
      if (readByok(window.localStorage).key) {
        setNeedsKey(false);
        return;
      }
      const health = await requestHealth(controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      // A failed check is not proof there is no key, so stay quiet.
      setNeedsKey(health !== null && !health.serverKey);
    };

    void evaluate();
    const onStorage = () => void evaluate();
    window.addEventListener("storage", onStorage);
    return () => {
      controller.abort();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!demanded) {
      return;
    }
    setNeedsKey(true);
    setOpen(true);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [demanded]);

  if (!needsKey) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      aria-labelledby="needs-key-heading"
      className="mt-6 rounded-[1.75rem] border border-primary/30 bg-primary/5 p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id="needs-key-heading" className="inline-flex items-center gap-2 text-base font-semibold">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            Connect your key
          </h3>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Confuzzle runs on an API key you control, so nothing is metered by us. Groq offers a free
            tier that is more than enough. <strong>Try a sample</strong> needs no key at all.
          </p>
        </div>
        {!open ? (
          <Button type="button" variant="brand" onClick={() => setOpen(true)}>
            Add a key
          </Button>
        ) : null}
      </div>
      {open ? (
        <div className="mt-5 border-t border-border/60 pt-5">
          <ProviderKeyForm
            compact
            onSaved={(settings) => {
              if (settings.key) {
                setNeedsKey(false);
                setOpen(false);
                onConnected?.();
              }
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
