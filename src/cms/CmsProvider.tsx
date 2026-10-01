import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { createDefaultSnapshot } from "./defaultContent";
import { CmsSnapshot, SiteContent } from "./types";

const STORAGE_KEY = "samriddhi.cms.snapshot.v1";

type CmsContextValue = {
  content: SiteContent;
  updatedAt: string;
  mode: "local-preview";
  save: (content: SiteContent) => void;
  update: (updater: (content: SiteContent) => SiteContent) => void;
  reset: () => void;
  exportSnapshot: () => string;
  importSnapshot: (raw: string) => void;
};

const CmsContext = createContext<CmsContextValue | null>(null);

function isSnapshot(value: unknown): value is CmsSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CmsSnapshot>;
  return candidate.schemaVersion === 1 && !!candidate.content && typeof candidate.content === "object";
}

function readSnapshot(): CmsSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultSnapshot();
    const parsed: unknown = JSON.parse(raw);
    return isSnapshot(parsed) ? parsed : createDefaultSnapshot();
  } catch {
    return createDefaultSnapshot();
  }
}

function persist(snapshot: CmsSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function CmsProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<CmsSnapshot>(readSnapshot);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const next: unknown = JSON.parse(event.newValue);
        if (isSnapshot(next)) setSnapshot(next);
      } catch {
        // Ignore malformed updates from another tab.
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const value = useMemo<CmsContextValue>(() => {
    const commit = (content: SiteContent) => {
      const next: CmsSnapshot = { schemaVersion: 1, updatedAt: new Date().toISOString(), content };
      persist(next);
      setSnapshot(next);
    };
    return {
      content: snapshot.content,
      updatedAt: snapshot.updatedAt,
      mode: "local-preview",
      save: commit,
      update: (updater) => commit(updater(structuredClone(snapshot.content))),
      reset: () => {
        const next = createDefaultSnapshot();
        persist(next);
        setSnapshot(next);
      },
      exportSnapshot: () => JSON.stringify(snapshot, null, 2),
      importSnapshot: (raw) => {
        const parsed: unknown = JSON.parse(raw);
        if (!isSnapshot(parsed)) throw new Error("This is not a valid Samriddhi CMS backup.");
        persist(parsed);
        setSnapshot(parsed);
      },
    };
  }, [snapshot]);

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
}

export function useCms() {
  const context = useContext(CmsContext);
  if (!context) throw new Error("useCms must be used inside CmsProvider");
  return context;
}

export const cmsStorageKey = STORAGE_KEY;
