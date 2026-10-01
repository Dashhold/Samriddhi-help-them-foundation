import { getAdminToken, clearAdminSession } from "../auth/adminSession"
import { ApiError, apiRequest } from "../lib/api"
import { defaultSiteContent } from "./defaultContent"
import { CmsSnapshot, SiteContent } from "./types"

export type RemoteSnapshot = CmsSnapshot & { revision: number }

type SnapshotLoader = () => Promise<RemoteSnapshot>

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function mergeKnownShape(defaultValue: unknown, incoming: unknown): unknown {
  if (Array.isArray(defaultValue))
    return Array.isArray(incoming)
      ? structuredClone(incoming)
      : structuredClone(defaultValue)
  if (isRecord(defaultValue)) {
    const source = isRecord(incoming) ? incoming : {}
    return Object.fromEntries(
      Object.entries(defaultValue).map(([key, value]) => [
        key,
        mergeKnownShape(value, source[key]),
      ]),
    )
  }
  return typeof incoming === typeof defaultValue ? incoming : defaultValue
}

export function normalizeSiteContent(value: unknown): SiteContent {
  const source = isRecord(value) ? structuredClone(value) : {}
  if (!isRecord(source.fundraising)) {
    source.fundraising = {
      ...defaultSiteContent.fundraising,
      campaigns: Array.isArray(source.campaigns) ? source.campaigns : [],
    }
  }
  delete source.hero
  delete source.campaigns
  return mergeKnownShape(defaultSiteContent, source) as SiteContent
}

function normalizeSnapshot(snapshot: RemoteSnapshot): RemoteSnapshot {
  return {
    schemaVersion: 2,
    updatedAt: snapshot.updatedAt,
    revision: Number(snapshot.revision),
    content: normalizeSiteContent(snapshot.content),
  }
}

export async function loadSiteContent(): Promise<RemoteSnapshot> {
  return normalizeSnapshot(await apiRequest<RemoteSnapshot>("/api/content"))
}

export async function loadAdminSiteContent(): Promise<RemoteSnapshot> {
  const token = getAdminToken()
  if (!token)
    throw new Error("Your administrator session expired. Sign in again.")
  try {
    return normalizeSnapshot(
      await apiRequest<RemoteSnapshot>("/api/admin/content", { token }),
    )
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403)
    )
      clearAdminSession()
    throw error
  }
}

export async function saveSiteContent(
  content: SiteContent,
  expectedRevision: number,
): Promise<RemoteSnapshot> {
  const token = getAdminToken()
  if (!token)
    throw new Error("Your administrator session expired. Sign in again.")
  try {
    return normalizeSnapshot(
      await apiRequest<RemoteSnapshot>("/api/admin/content", {
        method: "PUT",
        token,
        body: { content, expectedRevision },
      }),
    )
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403)
    )
      clearAdminSession()
    throw error
  }
}

export function subscribeToSiteContent(
  onUpdate: (snapshot: RemoteSnapshot) => void,
  load: SnapshotLoader = loadSiteContent,
) {
  let stopped = false
  let loading = false
  const refresh = async () => {
    if (stopped || loading || document.visibilityState === "hidden") return
    loading = true
    try {
      const snapshot = await load()
      if (!stopped) onUpdate(snapshot)
    } catch {
      // Keep the last valid snapshot during transient errors.
    } finally {
      loading = false
    }
  }
  const interval = window.setInterval(() => void refresh(), 30_000)
  const onFocus = () => void refresh()
  const onVisibility = () => {
    if (document.visibilityState === "visible") void refresh()
  }
  window.addEventListener("focus", onFocus)
  document.addEventListener("visibilitychange", onVisibility)
  return () => {
    stopped = true
    window.clearInterval(interval)
    window.removeEventListener("focus", onFocus)
    document.removeEventListener("visibilitychange", onVisibility)
  }
}

export function parseCmsBackup(raw: string): SiteContent {
  const parsed: unknown = JSON.parse(raw)
  if (!isRecord(parsed))
    throw new Error("This is not a valid Samriddhi CMS backup.")
  const content = "content" in parsed ? parsed.content : parsed
  if (!isRecord(content))
    throw new Error("The backup does not contain site content.")
  return normalizeSiteContent(content)
}
