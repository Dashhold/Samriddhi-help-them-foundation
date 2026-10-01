import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { isApiConfigured } from "../lib/api"
import { createDefaultSnapshot } from "./defaultContent"
import { CmsSnapshot, SiteContent } from "./types"
import {
  loadAdminSiteContent,
  loadSiteContent,
  parseCmsBackup,
  saveSiteContent,
  subscribeToSiteContent,
} from "./repository"

type CmsMode = "loading" | "remote" | "fallback"

type CmsContextValue = {
  content: SiteContent
  updatedAt: string
  revision: number
  mode: CmsMode
  loading: boolean
  saving: boolean
  error: string
  save: (content: SiteContent) => Promise<void>
  update: (updater: (content: SiteContent) => SiteContent) => Promise<void>
  refresh: () => Promise<void>
  reset: () => Promise<void>
  exportSnapshot: () => string
  importSnapshot: (raw: string) => Promise<void>
}

const CmsContext = createContext<CmsContextValue | null>(null)

export function CmsProvider({
  children,
  admin = false,
}: {
  children: ReactNode
  admin?: boolean
}) {
  const [snapshot, setSnapshot] = useState<CmsSnapshot>(createDefaultSnapshot)
  const [revision, setRevision] = useState(0)
  const [mode, setMode] = useState<CmsMode>(
    isApiConfigured ? "loading" : "fallback",
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const snapshotRef = useRef(snapshot)
  const revisionRef = useRef(revision)
  const load = admin ? loadAdminSiteContent : loadSiteContent

  const install = (next: CmsSnapshot & { revision?: number }) => {
    snapshotRef.current = next
    setSnapshot(next)
    if (typeof next.revision === "number") {
      revisionRef.current = next.revision
      setRevision(next.revision)
    }
  }

  const refresh = async () => {
    if (!isApiConfigured) {
      setMode("fallback")
      return
    }
    setError("")
    try {
      const remote = await load()
      install(remote)
      setMode("remote")
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The content service could not be reached.",
      )
      setMode("fallback")
    }
  }

  useEffect(() => {
    void refresh()
    if (!isApiConfigured) return
    return subscribeToSiteContent((remote) => {
      if (remote.revision > revisionRef.current) {
        install(remote)
        setMode("remote")
        setError("")
      }
    }, load)
  }, [admin])

  const commit = async (content: SiteContent) => {
    if (!isApiConfigured || mode !== "remote") {
      throw new Error(
        "The remote CMS is not connected. Check the API deployment before saving changes.",
      )
    }
    setSaving(true)
    setError("")
    try {
      const remote = await saveSiteContent(content, revisionRef.current)
      install(remote)
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Content could not be saved."
      setError(message)
      throw new Error(message)
    } finally {
      setSaving(false)
    }
  }

  const value = useMemo<CmsContextValue>(
    () => ({
      content: snapshot.content,
      updatedAt: snapshot.updatedAt,
      revision,
      mode,
      loading: mode === "loading",
      saving,
      error,
      save: commit,
      update: async (updater) =>
        commit(updater(structuredClone(snapshotRef.current.content))),
      refresh,
      reset: async () => commit(createDefaultSnapshot().content),
      exportSnapshot: () =>
        JSON.stringify(
          { ...snapshotRef.current, revision: revisionRef.current },
          null,
          2,
        ),
      importSnapshot: async (raw) => commit(parseCmsBackup(raw)),
    }),
    [snapshot, revision, mode, saving, error],
  )

  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>
}

export function useCms() {
  const context = useContext(CmsContext)
  if (!context) throw new Error("useCms must be used inside CmsProvider")
  return context
}
