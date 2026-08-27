"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requestHealth } from "@/lib/clarify-client";

export function HealthBanner() {
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void requestHealth(controller.signal).then((payload) => {
      if (payload) {
        setConfigured(payload.openai);
      }
    });
    return () => controller.abort();
  }, []);

  if (configured !== false) {
    return null;
  }

  return (
    <Alert className="mt-6 border-primary/25 bg-card/70 backdrop-blur-sm">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Live Unconfuzzle is not configured</AlertTitle>
      <AlertDescription>
        This server is missing <code>OPENAI_API_KEY</code>. Try a sample still works. Add the key to{" "}
        <code>.env.local</code> and restart to use your own sources.
      </AlertDescription>
    </Alert>
  );
}
