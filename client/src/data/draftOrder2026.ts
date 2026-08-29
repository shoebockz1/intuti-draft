// The 2026 draft order, randomized ahead of draft day (per HANDOFF.md the
// order is decided about a week beforehand, not at the start of the session)
// and confirmed by Robin on 2026-08-28.
//
// Exists for the same reason as ROSTERS_2025: "Wipe draft & start over"
// clears the setup entirely, and re-typing ten team names in the right order
// by hand every time is both tedious and easy to get subtly wrong.
//
// These are OWNER names, spelled exactly as they appear in rosters2025.ts.
// That exactness is load-bearing, not cosmetic — loadDraftOrder2026 matches on
// these strings to carry each owner's protected players across. Owners are used
// rather than team names because teams get renamed mid-season; the people don't.

export const DRAFT_ORDER_2026: string[] = [
  "Jason",
  "Phil",
  "Tee",
  "Vince",
  "Robin",
  "Mark G",
  "Mark Jr",
  "Paul",
  "Christian",
  "Mark Sr",
];

// Last season's 5th place finisher, who gets the jump pick after the 2nd
// unprotected selection. Stored as a name rather than an index so it can't
// drift silently if the order above is ever edited.
export const FIFTH_PLACE_2026 = "Mark Jr";
