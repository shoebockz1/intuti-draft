// Thin client for the server's commissioner session endpoints
// (/api/commissioner/*). See server/src/routes/commissioner.ts.

import { API_BASE } from "./config";

export async function commissionerLogin(passcode: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/commissioner/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passcode }),
  });
  return res.ok;
}

export async function commissionerStatus(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/commissioner/status`, { credentials: "include" });
  if (!res.ok) return false;
  const data = (await res.json()) as { isCommissioner: boolean };
  return data.isCommissioner;
}

export async function commissionerLogout(): Promise<void> {
  await fetch(`${API_BASE}/api/commissioner/logout`, { method: "POST", credentials: "include" });
}
