"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  addHistoryItem,
  clearWorkspace,
  deleteHistoryItem,
  ensureProfile,
  exportWorkspace,
  importWorkspace,
  readHistory,
  saveProfile,
  updateHistoryItem,
  WORKSPACE_EVENT,
  type HistoryItem,
  type HistoryPatch,
  type NewHistoryInput,
  type Profile,
  type WorkspaceExport,
} from "@/lib/workspace";
import { clearPhotos, deletePhoto } from "@/lib/photo-store";

type WorkspaceContextValue = {
  ready: boolean;
  profile: Profile | null;
  history: HistoryItem[];
  refresh: () => void;
  updateProfile: (patch: Parameters<typeof saveProfile>[0]) => Profile | null;
  addClarification: (input: NewHistoryInput) => HistoryItem | null;
  patchClarification: (id: string, patch: HistoryPatch) => HistoryItem | null;
  removeClarification: (id: string) => boolean;
  resetWorkspace: () => void;
  exportData: () => WorkspaceExport | null;
  importData: (raw: string) => { ok: true } | { ok: false; error: string };
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const refresh = useCallback(() => {
    setProfile(ensureProfile());
    setHistory(readHistory());
  }, []);

  useEffect(() => {
    refresh();
    setReady(true);

    const onChange = () => {
      setProfile(ensureProfile());
      setHistory(readHistory());
    };

    window.addEventListener(WORKSPACE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(WORKSPACE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ready,
      profile,
      history,
      refresh,
      updateProfile: (patch) => {
        if (typeof window === "undefined") {
          return null;
        }
        const next = saveProfile(patch);
        refresh();
        return next;
      },
      addClarification: (input) => {
        if (typeof window === "undefined") {
          return null;
        }
        const item = addHistoryItem(input);
        refresh();
        return item;
      },
      patchClarification: (id, patch) => {
        if (typeof window === "undefined") {
          return null;
        }
        const item = updateHistoryItem(id, patch);
        refresh();
        return item;
      },
      removeClarification: (id) => {
        if (typeof window === "undefined") {
          return false;
        }
        const removed = deleteHistoryItem(id);
        if (removed) {
          void deletePhoto(id).catch(() => undefined);
        }
        refresh();
        return removed;
      },
      resetWorkspace: () => {
        if (typeof window === "undefined") {
          return;
        }
        clearWorkspace();
        void clearPhotos().catch(() => undefined);
        refresh();
      },
      exportData: () => {
        if (typeof window === "undefined") {
          return null;
        }
        return exportWorkspace();
      },
      importData: (raw) => {
        if (typeof window === "undefined") {
          return { ok: false, error: "Import is only available in the browser." };
        }
        const result = importWorkspace(raw);
        if (result.ok) {
          refresh();
        }
        return result;
      },
    }),
    [history, profile, ready, refresh],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider.");
  }
  return context;
}
