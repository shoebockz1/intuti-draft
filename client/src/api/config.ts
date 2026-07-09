// Base URL for API calls. In local dev the client (Vite, :5173) and server
// (Express, :4000) are separate processes, so calls need an absolute URL. In
// a production build, the server serves the built client itself (same
// origin) — see server/src/index.ts — so calls should be relative, letting
// the browser resolve them against whatever host the app was actually
// loaded from. VITE_API_BASE can override this if ever needed, but nothing
// should have to set it for the default local-dev/production split to work.
export const API_BASE: string = import.meta.env.VITE_API_BASE ?? (import.meta.env.DEV ? "https://localhost:4000" : "");
