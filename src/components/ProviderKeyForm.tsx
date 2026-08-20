"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { checkKey } from "@/lib/clarify-client";
import {
  EMPTY_BYOK,
  clearByok,
  maskKey,
  readByok,
  writeByok,
  type ByokSettings,
} from "@/lib/byok";
import { PROVIDERS, isProviderId, providerSpec } from "@/lib/providers";
import { cn } from "@/lib/utils";

export function ProviderKeyForm({
  onSaved,
  compact = false,
}: {
  onSaved?: (settings: ByokSettings) => void;
  compact?: boolean;
}) {
  const [settings, setSettings] = useState<ByokSettings>(EMPTY_BYOK);
  const [keyInput, setKeyInput] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const stored = readByok(window.localStorage);
    setSettings(stored);
    setReady(true);
    return () => abortRef.current?.abort();
  }, []);

  const spec = providerSpec(settings.provider);
  const savedKey = settings.key;
  const pendingKey = keyInput.trim();
  const effectiveKey = pendingKey || savedKey;

  const persist = (next: ByokSettings) => {
    setSettings(next);
    writeByok(window.localStorage, next);
    onSaved?.(next);
  };

  const saveAndTest = async () => {
    const next: ByokSettings = { ...settings, key: effectiveKey };
    if (!next.key) {
      toast.error("Paste an API key first.");
      return;
    }
    if (next.provider === "custom" && !next.baseUrl) {
      toast.error("Custom providers need a base URL.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setChecking(true);
    const result = await checkKey(next, controller.signal);
    setChecking(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    persist(next);
    setKeyInput("");
    toast.success(`${result.provider} is connected with ${result.model}.`);
  };

  const remove = () => {
    clearByok(window.localStorage);
    setSettings(EMPTY_BYOK);
    setKeyInput("");
    onSaved?.(EMPTY_BYOK);
    toast.success("Key removed from this browser.");
  };

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      <div className="space-y-2">
        <Label htmlFor="provider">Provider</Label>
        <Select
          value={settings.provider}
          onValueChange={(value) => {
            if (!isProviderId(value) || value === settings.provider) {
              return;
            }
            // A key belongs to one provider, so switching clears it rather than
            // silently sending the old key somewhere new.
            setKeyInput("");
            persist({ provider: value, key: "", model: "", baseUrl: "" });
          }}
          disabled={!ready}
        >
          <SelectTrigger id="provider" aria-label="AI provider">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROVIDERS.map((provider) => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{spec.blurb}</p>
      </div>

      {settings.provider === "custom" ? (
        <div className="space-y-2">
          <Label htmlFor="base-url">Base URL</Label>
          <Input
            id="base-url"
            value={settings.baseUrl}
            onChange={(event) => setSettings({ ...settings, baseUrl: event.target.value })}
            onBlur={(event) => persist({ ...settings, baseUrl: event.target.value.trim() })}
            placeholder="https://example.com/v1"
            spellCheck={false}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="api-key">API key</Label>
        <Input
          id="api-key"
          type="password"
          value={keyInput}
          onChange={(event) => setKeyInput(event.target.value)}
          placeholder={savedKey ? maskKey(savedKey) : spec.keyPrefix ? `${spec.keyPrefix}…` : "Your API key"}
          autoComplete="off"
          spellCheck={false}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void saveAndTest();
            }
          }}
        />
        <p className="text-xs text-muted-foreground">
          Stays in this browser. It is sent with each request so the provider can answer, and is never
          saved on our server.{" "}
          <a
            href={spec.consoleUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-foreground underline underline-offset-4"
          >
            Get a key
          </a>
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model {settings.provider === "custom" ? "" : "(optional)"}</Label>
        <Input
          id="model"
          value={settings.model}
          onChange={(event) => setSettings({ ...settings, model: event.target.value })}
          onBlur={(event) => persist({ ...settings, model: event.target.value.trim() })}
          placeholder={spec.textModel || "model-name"}
          spellCheck={false}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="brand" onClick={() => void saveAndTest()} disabled={!ready || checking}>
          {checking ? <Loader2 className="animate-spin" aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
          {checking ? "Testing…" : savedKey ? "Save and test" : "Connect"}
        </Button>
        {savedKey ? (
          <Button type="button" variant="ghost" onClick={remove} disabled={checking}>
            <Trash2 aria-hidden="true" />
            Remove key
          </Button>
        ) : null}
      </div>

      {savedKey && !pendingKey ? (
        <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
          {spec.label} key saved as {maskKey(savedKey)}
        </p>
      ) : null}
    </div>
  );
}
