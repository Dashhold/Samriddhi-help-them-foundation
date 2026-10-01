import { ApiError, apiRequest } from "../lib/api"

const STORAGE_KEY = "samriddhi.admin.session.v1"
const SESSION_CLEARED_EVENT = "samriddhi:admin-session-cleared"

export type AdminIdentity = {
  id: string
  username: string
}

export type AdminSession = {
  token: string
  expiresAt: string
  admin: AdminIdentity
}

type SessionResponse = Omit<AdminSession, "token">

function validSession(value: unknown): value is AdminSession {
  if (!value || typeof value !== "object") return false
  const session = value as Partial<AdminSession>
  return (
    typeof session.token === "string" &&
    session.token.length >= 40 &&
    typeof session.expiresAt === "string" &&
    typeof session.admin?.id === "string" &&
    typeof session.admin.username === "string"
  )
}

export function onAdminSessionCleared(listener: () => void) {
  window.addEventListener(SESSION_CLEARED_EVENT, listener)
  return () => window.removeEventListener(SESSION_CLEARED_EVENT, listener)
}

export function clearAdminSession() {
  const hadSession = window.sessionStorage.getItem(STORAGE_KEY) !== null
  window.sessionStorage.removeItem(STORAGE_KEY)
  if (hadSession) window.dispatchEvent(new Event(SESSION_CLEARED_EVENT))
}

export function getStoredAdminSession() {
  try {
    const parsed: unknown = JSON.parse(
      window.sessionStorage.getItem(STORAGE_KEY) ?? "null",
    )
    if (!validSession(parsed) || Date.parse(parsed.expiresAt) <= Date.now()) {
      clearAdminSession()
      return null
    }
    return parsed
  } catch {
    clearAdminSession()
    return null
  }
}

export function getAdminToken() {
  return getStoredAdminSession()?.token ?? null
}

function storeAdminSession(session: AdminSession) {
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  return session
}

export async function loginAdmin(username: string, password: string) {
  const session = await apiRequest<AdminSession>("/api/auth/login", {
    method: "POST",
    body: { username, password },
  })
  return storeAdminSession(session)
}

export async function verifyAdminSession() {
  const stored = getStoredAdminSession()
  if (!stored) return null
  try {
    const verified = await apiRequest<SessionResponse>("/api/auth/session", {
      token: stored.token,
    })
    return storeAdminSession({ ...verified, token: stored.token })
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.status === 401 || error.status === 403)
    ) {
      clearAdminSession()
      return null
    }
    throw error
  }
}

export async function logoutAdmin() {
  const stored = getStoredAdminSession()
  try {
    if (stored) {
      await apiRequest<void>("/api/auth/logout", {
        method: "POST",
        token: stored.token,
      })
    }
  } finally {
    clearAdminSession()
  }
}
