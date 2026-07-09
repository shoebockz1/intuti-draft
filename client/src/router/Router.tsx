import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Minimal hand-rolled path router instead of pulling in react-router-dom.
// This app only ever needs two routes ("/" — shared draft board, "/admin" —
// commissioner setup), so a full routing library is unnecessary weight; this
// covers exactly what's needed: read window.location.pathname, re-render on
// browser back/forward (popstate), and a navigate() helper that pushes a new
// history entry without a full page reload. If more routes/params are ever
// needed, swap this for react-router-dom rather than growing this file.

interface RouterContextValue {
  path: string;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(next: string) {
    if (next !== window.location.pathname) {
      window.history.pushState(null, "", next);
    }
    setPath(next);
  }

  return <RouterContext.Provider value={{ path, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterContextValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within RouterProvider");
  return ctx;
}
