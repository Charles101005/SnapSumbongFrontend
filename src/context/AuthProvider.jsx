import { useCallback, useEffect, useMemo, useState } from "react";
import { refreshToken, logoutUser } from "../api/login";
import { getCurrentUser } from "../api/accounts";
import { setAccessToken, clearAccessToken } from "../api/authToken";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await refreshToken();
        if (cancelled) return;
        setAccessToken(data.access);
        const currentUser = await getCurrentUser();
        if (cancelled) return;
        setUser(currentUser);
        setStatus("authenticated");
      } catch {
        if (cancelled) return;
        clearAccessToken();
        setUser(null);
        setStatus("anonymous");
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const setSession = useCallback((currentUser) => {
    setUser(currentUser);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    clearAccessToken();
    setUser(null);
    setStatus("anonymous");
    window.location.replace("/");
  }, []);

  const value = useMemo(
    () => ({ status, user, setSession, logout }),
    [status, user, setSession, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
