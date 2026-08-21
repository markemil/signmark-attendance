import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { clearStoredToken, getStoredToken, setStoredToken } from "../lib/session";
import { AuthContext, type AuthState } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getStoredToken());
  const me = useQuery(api.auth.me, token ? { token } : "skip");
  const logoutMutation = useMutation(api.auth.logout);

  const setToken = useCallback((next: string) => {
    setStoredToken(next);
    setTokenState(next);
  }, []);

  const logout = useCallback(() => {
    if (token) void logoutMutation({ token });
    clearStoredToken();
    setTokenState(null);
  }, [token, logoutMutation]);

  // An expired/revoked token still resolves `me` to null (handled below via
  // `status`); this only sweeps it out of storage so a later reload starts
  // clean — it deliberately does not touch React state.
  useEffect(() => {
    if (token && me === null) clearStoredToken();
  }, [token, me]);

  let status: AuthState["status"] = "anon";
  if (token) status = me === undefined ? "loading" : me ? "authed" : "anon";

  const value: AuthState = {
    status,
    user: me ?? null,
    token,
    setToken,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
