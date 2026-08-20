"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";

import { ProviderKeyForm } from "@/components/ProviderKeyForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { OUTPUT_MODE_OPTIONS, isOutputMode } from "@/lib/input-router";
import { AUDIENCE_ROLE_OPTIONS, isAudienceRole } from "@/lib/workspace";

export default function SettingsPage() {
  const { ready, profile, updateProfile, resetWorkspace, exportData, importData } = useWorkspace();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const profileId = profile?.id ?? "";
  const storedName = profile?.displayName ?? "";
  const storedEmail = profile?.email ?? "";
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profileId) {
      return;
    }
    setDisplayName(storedName === "Guest" ? "" : storedName);
    setEmail(storedEmail);
  }, [profileId, storedName, storedEmail]);

  const save = () => {
    if (!profile) {
      return;
    }
    updateProfile({
      displayName: displayName.trim() || "Guest",
      email,
    });
    toast.success("Profile saved on this device.");
  };

  const downloadExport = () => {
    const data = exportData();
    if (!data) {
      toast.error("Nothing to export yet.");
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `confuzzle-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Workspace exported.");
  };

  const handleImport = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const result = importData(text);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Workspace imported.");
    } catch {
      toast.error("Could not read that file.");
    }
  };

  return (
    <main id="main" className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Settings</p>
        <h1 className="text-3xl font-semibold tracking-tight">Your workspace</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          This is a local profile — name, preferred mode, and history never leave this browser unless
          you export them. Confuzzle has no cloud account yet.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI key</CardTitle>
          <CardDescription>
            Confuzzle deciphers with your own provider key. It stays in this browser and is sent
            straight through to the provider.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProviderKeyForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>How Confuzzle should address you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Guest"
              autoComplete="nickname"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (optional, stays local)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <Button type="button" onClick={save} disabled={!ready}>
            Save profile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferred lens</CardTitle>
          <CardDescription>Used when Confuzzle is unsure which lens fits. Confuzzle still picks first.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-mode">When the source is unclear</Label>
            <Select
              value={profile?.defaultMode ?? "tl_dr"}
              onValueChange={(value) => {
                if (isOutputMode(value)) {
                  updateProfile({ defaultMode: value });
                  toast.success("Default mode updated.");
                }
              }}
              disabled={!ready}
            >
              <SelectTrigger id="default-mode" aria-label="Default output mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTPUT_MODE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} — {option.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">What usually has you confuzzled?</Label>
            <Select
              value={profile?.role ?? "other"}
              onValueChange={(value) => {
                if (isAudienceRole(value)) {
                  updateProfile({ role: value });
                  toast.success("Preference saved.");
                }
              }}
              disabled={!ready}
            >
              <SelectTrigger id="role" aria-label="Audience role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} — {option.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Backup</CardTitle>
          <CardDescription>Move this workspace to another browser with a JSON file.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" onClick={downloadExport} disabled={!ready}>
            <Download aria-hidden="true" />
            Export JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Import workspace JSON"
            onChange={(event) => {
              void handleImport(event.target.files);
              event.target.value = "";
            }}
          />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={!ready}>
            <Upload aria-hidden="true" />
            Import JSON
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base">Reset this device</CardTitle>
          <CardDescription>
            Deletes your local profile and history. Theme preference is left alone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="destructive"
            disabled={!ready}
            onClick={() => {
              const confirmed = window.confirm(
                "Delete all local Confuzzle data on this device? This cannot be undone unless you exported first.",
              );
              if (!confirmed) {
                return;
              }
              resetWorkspace();
              setDisplayName("");
              setEmail("");
              toast.success("Workspace cleared.");
            }}
          >
            Clear workspace
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
