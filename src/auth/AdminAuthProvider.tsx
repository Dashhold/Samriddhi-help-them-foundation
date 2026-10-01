import { Session, User } from "@supabase/supabase-js";
import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type AuthStatus = "loading" | "unconfigured" | "signed-out" | "checking" | "authorized" | "forbidden";

type AdminAuthContextValue = {
  status: AuthStatus;
  user: User | null;
  error: string;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isSupabaseConfigured ? "loading" : "unconfigured");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");

  const authorize = async (session: Session | null) => {
    if (!supabase || !session?.user) {
      setUser(null);
      setStatus(isSupabaseConfigured ? "signed-out" : "unconfigured");
      return;
    }
    setStatus("checking");
    setUser(session.user);
    const { data, error: membershipError } = await supabase
      .from("admin_users")
      .select("active")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (membershipError) {
      setError(membershipError.message);
      setStatus("forbidden");
      return;
    }
    setStatus(data?.active ? "authorized" : "forbidden");
  };

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
        setStatus("signed-out");
        return;
      }
      void authorize(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => { if (active) void authorize(session); }, 0);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AdminAuthContextValue>(() => ({
    status,
    user,
    error,
    signIn: async (email, password) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      setError("");
      setStatus("loading");
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setStatus("signed-out");
        throw new Error(signInError.message);
      }
      await authorize(data.session);
    },
    signOut: async () => {
      if (supabase) await supabase.auth.signOut();
      setUser(null);
      setStatus(isSupabaseConfigured ? "signed-out" : "unconfigured");
    },
  }), [status, user, error]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return context;
}
