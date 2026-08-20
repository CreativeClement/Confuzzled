"use client";

import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";

import { ProviderKeyForm } from "@/components/ProviderKeyForm";
import { Button } from "@/components/ui/button";
import { requestHealth } from "@/lib/clarify-client";
import { readByok } from "@/lib/byok";

/**
 * Confuzzle cannot decipher anything without a key somewhere. When neither the
 * reader nor the server has one, say so before they type a wall of text.
 */
export function HealthBanner() {
  const [needsKey, setNeedsKey] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const evaluate = async () => {
      const hasLocalKey = Boolean(readByok(window.localStorage).key);
      if (hasLocalKey) {
        setNeedsKey(false);
        return;
      }
      const health = await requestHealth(controller.signal);
      setNeedsKey(!health?.serverKey);
    };
    void evaluate();

    const onStorage = () => void evaluate();
    window.addEventListener("storage", onStorage);
    return () => {
      controller.abort();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  if (!needsKey) {
    return null;
  }

  return (
    <section
      aria-labelledby="needs-key-heading"
      className="mt-6 rounded-[1.75rem] border border-primary/30 bg-primary/5 p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="needs-key-heading" className="inline-flex items-center gap-2 text-base font-semibold">
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            Connect a key to decipher for real
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Confuzzle runs on your own AI key, so nothing is metered by us. Groq has a free tier that
            works fine. <strong>Try a sample</strong> works right now without any key.
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
              }
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
