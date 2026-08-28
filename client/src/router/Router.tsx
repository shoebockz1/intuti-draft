import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from "react";

// Minimal hand-rolled path router instead of pulling in react-router-dom.
// The route list is small and static ("/" — shared draft board, "/admin" —
// commissioner setup, "/players" — free agent research, plus the standalone
// tab-workspace pages), so a full routing library is unnecessary weight; this
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

// Real anchor for in-app navigation. Everything used to be a
// <button onClick={navigate(...)}>, which meant ctrl/cmd-click, middle-click,
// "Open link in new tab" and drag-to-tab-bar all did nothing — you could only
// ever have one page open at a time. Owners run this like ClickyDraft, with
// the board, the player list and last year's rosters each in their own tab,
// so these have to be genuine links.
//
// A plain left-click is intercepted for client-side routing (no full reload);
// anything that means "open this somewhere else" is left alone for the
// browser to handle natively. Middle-click never reaches onClick at all (it
// fires auxclick), so it works by default — the button check is belt-and-braces.
export function AppLink({
  to,
  children,
  className,
  style,
  title,
}: {
  to: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  const { navigate } = useRouter();

  return (
    <a
      href={to}
      className={className}
      style={style}
      title={title}
      onClick={(e) => {
        if (e.defaultPrevented) return;
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
