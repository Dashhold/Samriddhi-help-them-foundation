import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { isApiConfigured } from "../lib/api"
import {
  AdminIdentity,
  clearAdminSession,
  getStoredAdminSession,
  loginAdmin,
  logoutAdmin,
  onAdminSessionCleared,
  verifyAdminSession,
} from "./adminSession"

type AuthStatus = "loading" | "unconfigured" | "signed-out" | "authorized" | "unavailable"

type AdminAuthContextValue = {
  status: AuthStatus
  user: AdminIdentity | null
  error: string
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    isApiConfigured ? "loading" : "unconfigured",
  )
  const [user, setUser] = useState<AdminIdentity | null>(null)
  const [error, setError] = useState("")

  useEffect(
    () =>
      onAdminSessionCleared(() => {
        setUser(null)
        setError("")
        setStatus(isApiConfigured ? "signed-out" : "unconfigured")
      }),
    [],
  )

  useEffect(() => {
    if (!isApiConfigured) return
    let active = true
    verifyAdminSession()
      .then((session) => {
        if (!active) return
        setUser(session?.admin ?? null)
        setStatus(session ? "authorized" : "signed-out")
      })
      .catch((sessionError) => {
        if (!active) return
        setUser(null)
        setError(
          sessionError instanceof Error
            ? sessionError.message
            : "The authentication service could not be reached.",
        )
        setStatus("unavailable")
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (status !== "authorized") return
    const session = getStoredAdminSession()
    if (!session) return
    const delay = Math.max(0, Date.parse(session.expiresAt) - Date.now())
    const timer = window.setTimeout(clearAdminSession, delay)
    return () => window.clearTimeout(timer)
  }, [status, user])

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      status,
      user,
      error,
      signIn: async (username, password) => {
        if (!isApiConfigured)
          throw new Error("The website API is not configured.")
        setError("")
        try {
          const session = await loginAdmin(username, password)
          setUser(session.admin)
          setStatus("authorized")
        } catch (signInError) {
          setUser(null)
          setStatus("signed-out")
          throw signInError
        }
      },
      signOut: async () => {
        try {
          await logoutAdmin()
        } catch {
          // Local sign-out still completes if the API is temporarily unreachable.
        } finally {
          setUser(null)
          setError("")
          setStatus(isApiConfigured ? "signed-out" : "unconfigured")
        }
      },
    }),
    [status, user, error],
  )

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context)
    throw new Error("useAdminAuth must be used inside AdminAuthProvider")
  return context
}
