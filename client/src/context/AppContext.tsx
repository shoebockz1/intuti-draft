import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { DraftState, ProtectedPlayer } from "../engine/types";
import { NUM_OWNERS } from "../engine/types";
import {
  hardResetDraft,
  pickKeepOwn as apiPickKeepOwn,
  pickUnprotected as apiPickUnprotected,
  startDraftOnServer,
  undoPick as apiUndoPick,
  type TransactionLogEntry,
} from "../api/draft";
import { commissionerStatus } from "../api/commissioner";
import { useRouter } from "../router/Router";

export type SetupTab = "order" | "protected" | "randomizer";

function defaultOwnerNames(): string[] {
  return Array.from({ length: NUM_OWNERS }, (_, i) => `Owner ${i + 1}`);
}

function defaultProtectedPlayers(): ProtectedPlayer[][] {
  return Array.from({ length: NUM_OWNERS }, () => []);
}

interface AppContextValue {
  // setup data (used to assemble the POST /api/draft/start payload)
  ownerNames: string[];
  setOwnerNames: (names: string[]) => void;
  protectedPlayers: ProtectedPlayer[][];
  setProtectedPlayers: (p: ProtectedPlayer[][]) => void;
  fifthPos: number;
  setFifthPos: (i: number) => void;

  // navigation (within the setup flow at /admin)
  setupTab: SetupTab;
  setSetupTab: (t: SetupTab) => void;

  // randomizer (standalone utility, separate from ownerNames used for live draft order)
  randOrder: string[] | null;
  setRandOrder: (o: string[] | null) => void;

  // server-sourced draft truth — no local reducer anymore. `draft` is a
  // mirror of the server's authoritative DraftState, kept fresh by polling
  // (see routes/BoardRoute.tsx) and by optimistic updates right after a pick
  // action resolves. `setDraft` is exposed so those call sites can update it.
  draft: DraftState | null;
  setDraft: (d: DraftState | null) => void;

  // transaction log — polled alongside draft state (see useDraftPolling).
  // Currently only consumed by FifthPlacePanel (to find the "when was the
  // jump pick made" timestamp, which Pick itself doesn't carry), but kept
  // here rather than fetched ad-hoc so any future consumer shares one poll.
  transactionLog: TransactionLogEntry[];
  setTransactionLog: (log: TransactionLogEntry[]) => void;

  // commissioner session (checked once against the server; also updated by
  // login/logout). Used to gate Undo/Reset UI on the shared board, and to
  // decide what /admin renders.
  isCommissioner: boolean;
  setIsCommissioner: (v: boolean) => void;

  // commissioner-gated actions
  startDraft: () => Promise<void>;
  undoLastPick: () => Promise<void>;
  hardReset: () => Promise<void>;

  // pick actions — open to everyone, no commissioner check (see HANDOFF.md: trusted friend group, no turn locking)
  keepOwnPick: (protIdx: number) => Promise<void>;
  draftUnprotectedPick: (playerName: string) => Promise<void>;

  // who-am-i / research (per-viewer UI convenience only, no enforcement)
  myOwnerIdx: number;
  setMyOwnerIdx: (i: number) => void;
  whoAmIOpen: boolean;
  setWhoAmIOpen: (v: boolean) => void;

  // toast
  toast: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { navigate } = useRouter();

  const [ownerNames, setOwnerNames] = useState<string[]>(defaultOwnerNames());
  const [protectedPlayers, setProtectedPlayers] = useState<ProtectedPlayer[][]>(defaultProtectedPlayers());
  const [fifthPos, setFifthPos] = useState(0);

  const [setupTab, setSetupTab] = useState<SetupTab>("order");
  const [randOrder, setRandOrder] = useState<string[] | null>(null);

  const [draft, setDraft] = useState<DraftState | null>(null);
  const [transactionLog, setTransactionLog] = useState<TransactionLogEntry[]>([]);
  const [isCommissioner, setIsCommissioner] = useState(false);

  const [myOwnerIdx, setMyOwnerIdx] = useState(0);
  const [whoAmIOpen, setWhoAmIOpen] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // Whenever the draft goes from "not started" to "in progress" — whether
  // because this tab just started it, or because a poll picked up a draft
  // someone else started — prompt this viewer for "who are you" once. This
  // is an honest, low-tech identity stand-in (see HANDOFF.md), not enforced.
  const prevDraftRef = useRef<DraftState | null>(null);
  useEffect(() => {
    if (!prevDraftRef.current && draft) {
      setWhoAmIOpen(true);
    }
    prevDraftRef.current = draft;
  }, [draft]);

  // Check commissioner session once on load, regardless of which route we're
  // on — this lets the shared board ("/") show/hide the commissioner-only
  // Undo/Reset controls without requiring a visit to /admin first in the
  // same tab. AdminRoute re-checks (and updates) this itself too.
  useEffect(() => {
    let cancelled = false;
    commissionerStatus().then((ok) => {
      if (!cancelled) setIsCommissioner(ok);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const startDraft = useCallback(async () => {
    // A draft already exists server-side (e.g. the commissioner revisited
    // /admin after starting one) — starting again would silently wipe it.
    // Require explicit confirmation, matching how hardReset protects the
    // other destructive path.
    if (draft) {
      const confirmed = window.confirm(
        `A draft is already in progress (pick ${draft.cur + 1} of ${draft.picks.length}). ` +
          "Starting again will WIPE the current draft and cannot be undone. Continue?",
      );
      if (!confirmed) return;
    }
    try {
      const state = await startDraftOnServer(ownerNames, protectedPlayers, fifthPos);
      setDraft(state);
      navigate("/");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to start draft.");
    }
  }, [draft, ownerNames, protectedPlayers, fifthPos, navigate, showToast]);

  const undoLastPick = useCallback(async () => {
    try {
      const { state, toast: t } = await apiUndoPick();
      setDraft(state);
      if (t) showToast(t);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to undo.");
    }
  }, [showToast]);

  const hardReset = useCallback(async () => {
    if (!window.confirm("This will permanently wipe the entire draft. Are you absolutely sure?")) return;
    try {
      await hardResetDraft();
      setDraft(null);
      setOwnerNames(defaultOwnerNames());
      setProtectedPlayers(defaultProtectedPlayers());
      setFifthPos(0);
      setSetupTab("order");
      navigate("/admin");
      showToast("Draft wiped");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to reset draft.");
    }
  }, [navigate, showToast]);

  const keepOwnPick = useCallback(
    async (protIdx: number) => {
      try {
        const { state, toast: t } = await apiPickKeepOwn(protIdx);
        setDraft(state);
        if (t) showToast(t);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to make pick.");
      }
    },
    [showToast],
  );

  const draftUnprotectedPick = useCallback(
    async (playerName: string) => {
      try {
        const { state, toast: t } = await apiPickUnprotected(playerName);
        setDraft(state);
        if (t) showToast(t);
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Failed to make pick.");
      }
    },
    [showToast],
  );

  const value: AppContextValue = {
    ownerNames,
    setOwnerNames,
    protectedPlayers,
    setProtectedPlayers,
    fifthPos,
    setFifthPos,
    setupTab,
    setSetupTab,
    randOrder,
    setRandOrder,
    draft,
    setDraft,
    transactionLog,
    setTransactionLog,
    isCommissioner,
    setIsCommissioner,
    startDraft,
    undoLastPick,
    hardReset,
    keepOwnPick,
    draftUnprotectedPick,
    myOwnerIdx,
    setMyOwnerIdx,
    whoAmIOpen,
    setWhoAmIOpen,
    toast,
    showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
