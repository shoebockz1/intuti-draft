import type { PlayerStats } from "../api/players";

export interface StatColumn {
  key: keyof PlayerStats;
  label: string;
}

// Raw counting-stat columns shown once a specific position tab is selected
// (not for "ALL", where mixed positions have no comparable column set — see
// FreeAgentsRoute.tsx). Field names/order verified against real Sleeper
// season-stats payloads, not guessed — see sleeperService.ts.
export const POSITION_STAT_COLUMNS: Record<string, StatColumn[]> = {
  QB: [
    { key: "passCmp", label: "Cmp" },
    { key: "passAtt", label: "Att" },
    { key: "passYd", label: "Pass Yd" },
    { key: "passTd", label: "Pass TD" },
    { key: "passInt", label: "Int" },
    { key: "rushYd", label: "Rush Yd" },
    { key: "rushTd", label: "Rush TD" },
  ],
  RB: [
    { key: "rushAtt", label: "Att" },
    { key: "rushYd", label: "Rush Yd" },
    { key: "rushTd", label: "Rush TD" },
    { key: "rec", label: "Rec" },
    { key: "recYd", label: "Rec Yd" },
    { key: "recTd", label: "Rec TD" },
  ],
  WR: [
    { key: "rec", label: "Rec" },
    { key: "recTgt", label: "Tgt" },
    { key: "recYd", label: "Rec Yd" },
    { key: "recTd", label: "Rec TD" },
  ],
  TE: [
    { key: "rec", label: "Rec" },
    { key: "recTgt", label: "Tgt" },
    { key: "recYd", label: "Rec Yd" },
    { key: "recTd", label: "Rec TD" },
  ],
  K: [
    { key: "fgm", label: "FGM" },
    { key: "fga", label: "FGA" },
    { key: "xpm", label: "XPM" },
    { key: "xpa", label: "XPA" },
  ],
  DEF: [
    { key: "sack", label: "Sck" },
    { key: "int", label: "Int" },
    { key: "fumRec", label: "FR" },
    { key: "defTd", label: "TD" },
    { key: "ptsAllow", label: "Pts Allow" },
  ],
};
