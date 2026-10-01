import { FormEvent, useState } from "react";
import { AdminAuthProvider, useAdminAuth } from "../auth/AdminAuthProvider";
import { useCms } from "../cms/CmsProvider";
import { AppLink } from "../lib/router";
import { Icon, Logo } from "../components/ui";
import AdminDashboard from "./AdminDashboard";

function AdminLogin() {
  const { signIn } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try { await signIn(email.trim(), password); }
    catch (signInError) { setError(signInError instanceof Error ? signInError.message : "Sign in failed."); }
    finally { setSubmitting(false); }
  };
  return <div className="admin-auth-page"><div className="admin-auth-panel"><Logo/><span className="admin-auth-icon"><Icon name="shield" size={25}/></span><span className="eyebrow">Secure administration</span><h1>Sign in to Samriddhi CMS</h1><p>Use the administrator account created by the foundation in Supabase Auth.</p><form onSubmit={submit}><label className="admin-field"><span>Email address</span><input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.org"/></label><label className="admin-field"><span>Password</span><input type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••••••"/></label>{error && <div className="admin-auth-error" role="alert">{error}</div>}<button className="admin-button" disabled={submitting} type="submit">{submitting ? "Signing in…" : "Sign in"}<Icon name="arrow" size={16}/></button></form><AppLink className="admin-auth-back" to="/">← Return to public website</AppLink></div></div>;
}

function AdminGate() {
  const auth = useAdminAuth();
  const cms = useCms();
  if (auth.status === "unconfigured") return <div className="admin-auth-page"><div className="admin-auth-panel"><span className="admin-auth-icon"><Icon name="settings" size={25}/></span><span className="eyebrow">Backend setup required</span><h1>Connect Supabase</h1><p>The secure admin dashboard is disabled until the deployment has a Supabase URL and publishable key.</p><div className="admin-auth-code"><code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_PUBLISHABLE_KEY</code></div><p className="admin-auth-note">Apply the migration in <strong>supabase/migrations</strong>, then create and promote the first administrator using <strong>supabase/README.md</strong>.</p><AppLink className="admin-button admin-button--secondary" to="/">Return to website</AppLink></div></div>;
  if (auth.status === "loading" || auth.status === "checking") return <div className="admin-auth-page"><div className="admin-auth-loading"><span/><p>{auth.status === "checking" ? "Checking administrator access…" : "Restoring secure session…"}</p></div></div>;
  if (auth.status === "signed-out") return <AdminLogin/>;
  if (auth.status === "forbidden") return <div className="admin-auth-page"><div className="admin-auth-panel"><span className="admin-auth-icon admin-auth-icon--danger"><Icon name="shield" size={25}/></span><span className="eyebrow">Access denied</span><h1>Not an active administrator</h1><p>{auth.user?.email ?? "This account"} is authenticated, but it is not active in the protected <code>admin_users</code> table.</p>{auth.error && <div className="admin-auth-error">{auth.error}</div>}<button className="admin-button" onClick={() => void auth.signOut()}>Sign out</button></div></div>;
  if (cms.loading) return <div className="admin-auth-page"><div className="admin-auth-loading"><span/><p>Loading published content…</p></div></div>;
  if (cms.mode !== "remote") return <div className="admin-auth-page"><div className="admin-auth-panel"><span className="admin-auth-icon admin-auth-icon--danger"><Icon name="close" size={25}/></span><span className="eyebrow">Content service unavailable</span><h1>Dashboard cannot open safely</h1><p>The public site is using bundled fallback content, but editing is disabled to prevent accidental data loss.</p>{cms.error && <div className="admin-auth-error">{cms.error}</div>}<button className="admin-button" onClick={() => void cms.refresh()}>Try again</button></div></div>;
  return <AdminDashboard/>;
}

export default function AdminAccess() {
  return <AdminAuthProvider><AdminGate/></AdminAuthProvider>;
}
