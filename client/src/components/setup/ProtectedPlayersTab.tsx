import { useEffect, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import { NUM_OWNERS } from "../../engine/types";
import { randPlayerName } from "../../data/testNames";
import { fetchAllPlayers, searchPlayers, type RemotePlayer } from "../../api/players";

const SEARCH_DEBOUNCE_MS = 200;
const MAX_SUGGESTIONS = 8;

export default function ProtectedPlayersTab() {
  const { ownerNames, protectedPlayers, setProtectedPlayers, setSetupTab, startDraft, showToast } = useApp();
  const [inputs, setInputs] = useState<string[]>(() => Array.from({ length: NUM_OWNERS }, () => ""));
  // Sleeper-backed search suggestions per owner row. This is purely additive —
  // the free-text input/Add flow below still works exactly as before even if
  // the server/Sleeper is unreachable (searchPlayers just yields no results).
  const [suggestions, setSuggestions] = useState<RemotePlayer[][]>(() =>
    Array.from({ length: NUM_OWNERS }, () => []),
  );
  const [dropdownOpenIdx, setDropdownOpenIdx] = useState<number | null>(null);
  const debounceTimers = useRef<Array<ReturnType<typeof setTimeout> | null>>(
    Array.from({ length: NUM_OWNERS }, () => null),
  );

  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      timers.forEach((t) => t && clearTimeout(t));
    };
  }, []);

  function addProt(i: number, name?: string) {
    const value = (name ?? inputs[i]).trim();
    if (!value) return;
    const next = protectedPlayers.map((arr, idx) => (idx === i ? [...arr, { name: value, used: false }] : arr));
    setProtectedPlayers(next);
    const nextInputs = [...inputs];
    nextInputs[i] = "";
    setInputs(nextInputs);
    setSuggestions((s) => s.map((arr, idx) => (idx === i ? [] : arr)));
    setDropdownOpenIdx(null);
  }

  function removeProt(i: number, j: number) {
    const next = protectedPlayers.map((arr, idx) => (idx === i ? arr.filter((_, k) => k !== j) : arr));
    setProtectedPlayers(next);
  }

  function handleInputChange(i: number, value: string) {
    const nextInputs = [...inputs];
    nextInputs[i] = value;
    setInputs(nextInputs);

    if (debounceTimers.current[i]) clearTimeout(debounceTimers.current[i]!);

    const query = value.trim();
    if (!query) {
      setSuggestions((s) => s.map((arr, idx) => (idx === i ? [] : arr)));
      return;
    }

    debounceTimers.current[i] = setTimeout(() => {
      searchPlayers(query)
        .then((results) => {
          setSuggestions((s) => s.map((arr, idx) => (idx === i ? results.slice(0, MAX_SUGGESTIONS) : arr)));
          setDropdownOpenIdx(i);
        })
        .catch(() => {
          // Server/Sleeper unreachable — no suggestions, but the free-text
          // Add button/Enter-to-add flow below is unaffected.
          setSuggestions((s) => s.map((arr, idx) => (idx === i ? [] : arr)));
        });
    }, SEARCH_DEBOUNCE_MS);
  }

  async function fillTestData() {
    const usedNames = new Set<string>();
    protectedPlayers.forEach((arr) => arr.forEach((p) => usedNames.add(p.name)));
    const totalNeeded = protectedPlayers.reduce((sum, arr) => sum + Math.max(0, 17 - arr.length), 0);

    let realNames: string[] = [];
    try {
      const players = await fetchAllPlayers();
      const shuffled = [...players].sort(() => Math.random() - 0.5);
      for (const p of shuffled) {
        if (realNames.length >= totalNeeded) break;
        if (usedNames.has(p.fullName)) continue;
        usedNames.add(p.fullName);
        realNames.push(p.fullName);
      }
    } catch {
      // Server not running / Sleeper unreachable — fall back to the
      // generated fake-name list below so this button still works offline.
    }

    let nameIdx = 0;
    const next = protectedPlayers.map((arr) => {
      const needed = Math.max(0, 17 - arr.length);
      const additions = Array.from({ length: needed }, () => {
        const name = nameIdx < realNames.length ? realNames[nameIdx++] : randPlayerName(usedNames);
        return { name, used: false };
      });
      return [...arr, ...additions];
    });
    setProtectedPlayers(next);
    showToast(
      realNames.length > 0
        ? "Test data filled with real players — add your last player per owner"
        : "Test data filled — add your last player per owner",
    );
  }

  function clearTestData() {
    setProtectedPlayers(Array.from({ length: NUM_OWNERS }, () => []));
    showToast("Protected players cleared");
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button className="btn sm" onClick={fillTestData}>
          Fill with test data (17 per owner)
        </button>
        <button className="btn sm danger" onClick={clearTestData}>
          Clear all
        </button>
        <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 4 }}>
          For testing only — replaces real rosters before draft day
        </span>
      </div>

      {ownerNames.map((name, i) => (
        <div style={{ marginBottom: 14 }} key={i}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <div className="slabel" style={{ marginBottom: 0 }}>
              {name || `Owner ${i + 1}`}
            </div>
            <span style={{ fontSize: 10, color: "var(--text3)" }}>
              {protectedPlayers[i].length} player{protectedPlayers[i].length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6, minHeight: 20 }}>
            {protectedPlayers[i].map((p, j) => (
              <span className="prot-tag" key={j}>
                {p.name}
                <span className="prot-tag-x" onClick={() => removeProt(i, j)}>
                  ×
                </span>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <div className="prot-search-wrap">
              <input
                type="text"
                placeholder="Search a real player, or type any name"
                style={{ width: "100%" }}
                value={inputs[i]}
                onChange={(e) => handleInputChange(i, e.target.value)}
                onFocus={() => {
                  if (suggestions[i].length > 0) setDropdownOpenIdx(i);
                }}
                onBlur={() => {
                  // Delay so a click on a dropdown item registers before we close it.
                  setTimeout(() => setDropdownOpenIdx((cur) => (cur === i ? null : cur)), 150);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addProt(i);
                  if (e.key === "Escape") setDropdownOpenIdx(null);
                }}
              />
              {dropdownOpenIdx === i && suggestions[i].length > 0 && (
                <div className="prot-search-dropdown">
                  {suggestions[i].map((p) => (
                    <div
                      className="prot-search-item"
                      key={p.playerId}
                      onMouseDown={(e) => {
                        // onMouseDown fires before the input's onBlur, so the
                        // click registers even though the input loses focus.
                        e.preventDefault();
                        addProt(i, p.fullName);
                      }}
                    >
                      <span className="prot-search-name">
                        {p.fullName}
                        {p.isRookie ? " (rookie)" : ""}
                      </span>
                      <span className="prot-search-meta">
                        {p.position}
                        {p.nflTeam ? ` — ${p.nflTeam}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="btn sm" onClick={() => addProt(i)}>
              Add
            </button>
          </div>
        </div>
      ))}

      <div style={{ marginTop: "1.25rem", display: "flex", gap: 8 }}>
        <button className="btn" onClick={() => setSetupTab("order")}>
          ← Back
        </button>
        <button className="btn primary" onClick={startDraft}>
          Start draft
        </button>
      </div>
    </div>
  );
}
