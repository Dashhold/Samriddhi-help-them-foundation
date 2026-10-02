import { FormEvent, useState } from "react"
import { AdminAuthProvider, useAdminAuth } from "../auth/AdminAuthProvider"
import { CmsProvider, useCms } from "../cms/CmsProvider"
import { AppLink } from "../lib/router"
import { Icon, Logo } from "../components/ui"
import AdminDashboard from "./AdminDashboard"

function AdminLogin() {
  const { signIn } = useAdminAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      await signIn(username.trim(), password)
      setPassword("")
    } catch (signInError) {
      setError(
        signInError instanceof Error ? signInError.message : "Sign in failed.",
      )
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <div className="admin-auth-page">
      <div className="admin-auth-panel">
        <Logo />
        <span className="admin-auth-icon">
          <Icon name="shield" size={25} />
        </span>
        <span className="eyebrow">Secure administration</span>
        <h1>Sign in to Samriddhi CMS</h1>
        <p>
          Use the administrator username and password configured securely on the
          API service.
        </p>
        <form onSubmit={submit}>
          <label className="admin-field">
            <span>Username</span>
            <input
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Administrator username"
            />
          </label>
          <label className="admin-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••••••"
            />
          </label>
          {error && (
            <div className="admin-auth-error" role="alert">
              {error}
            </div>
          )}
          <button className="admin-button" disabled={submitting} type="submit">
            {submitting ? "Signing in…" : "Sign in"}
            <Icon name="arrow" size={16} />
          </button>
        </form>
        <AppLink className="admin-auth-back" to="/">
          ← Return to public website
        </AppLink>
      </div>
    </div>
  )
}

function AdminContentGate() {
  const cms = useCms()
  if (cms.loading)
    return (
      <div className="admin-auth-page">
        <div className="admin-auth-loading">
          <span />
          <p>Loading editable content…</p>
        </div>
      </div>
    )
  if (cms.mode !== "remote")
    return (
      <div className="admin-auth-page">
        <div className="admin-auth-panel">
          <span className="admin-auth-icon admin-auth-icon--danger">
            <Icon name="close" size={25} />
          </span>
          <span className="eyebrow">Content service unavailable</span>
          <h1>Dashboard cannot open safely</h1>
          <p>
            The public site is using bundled fallback content, but editing is
            disabled to prevent accidental data loss.
          </p>
          {cms.error && <div className="admin-auth-error">{cms.error}</div>}
          <button className="admin-button" onClick={() => void cms.refresh()}>
            Try again
          </button>
        </div>
      </div>
    )
  return <AdminDashboard />
}

function AdminGate() {
  const auth = useAdminAuth()
  if (auth.status === "unconfigured")
    return (
      <div className="admin-auth-page">
        <div className="admin-auth-panel">
          <span className="admin-auth-icon">
            <Icon name="settings" size={25} />
          </span>
          <span className="eyebrow">Backend setup required</span>
          <h1>Connect the Railway API</h1>
          <p>
            Production requires the backend&apos;s public Railway origin as a
            frontend build variable. Local Vite development can point the same
            variable at a loopback API.
          </p>
          <div className="admin-auth-code">
            <code>VITE_API_URL=https://backend-domain.up.railway.app</code>
          </div>
          <p className="admin-auth-note">
            Set the variable on the frontend service, then redeploy it.
          </p>
          <AppLink className="admin-button admin-button--secondary" to="/">
            Return to website
          </AppLink>
        </div>
      </div>
    )
  if (auth.status === "loading")
    return (
      <div className="admin-auth-page">
        <div className="admin-auth-loading">
          <span />
          <p>Restoring and verifying secure session…</p>
        </div>
      </div>
    )
  if (auth.status === "signed-out") return <AdminLogin />
  if (auth.status === "unavailable")
    return (
      <div className="admin-auth-page">
        <div className="admin-auth-panel">
          <span className="admin-auth-icon admin-auth-icon--danger">
            <Icon name="close" size={25} />
          </span>
          <span className="eyebrow">Authentication service unavailable</span>
          <h1>Dashboard cannot open safely</h1>
          <p>
            The API could not verify an administrator session. No protected
            content has been shown.
          </p>
          {auth.error && <div className="admin-auth-error">{auth.error}</div>}
          <button
            className="admin-button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </div>
    )
  return (
    <CmsProvider admin>
      <AdminContentGate />
    </CmsProvider>
  )
}

export default function AdminAccess() {
  return (
    <AdminAuthProvider>
      <AdminGate />
    </AdminAuthProvider>
  )
}
