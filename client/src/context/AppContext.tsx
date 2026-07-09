import React, { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from "react";
import type { DraftState, ProtectedPlayer } from "../engine/types";
import { NUM_OWNERS } from "../engine/types";
import { createDraftState } from "../engine/draftEngine";
import { draftReducer, type DraftAction } from "../engine/draftReducer";

export type Screen = "setup" | "draft";
export type SetupTab = "order" | "protected" | "randomizer";

function defaultOwnerNames(): string[] {
  return Array.from({ length: NUM_OWNERS }, (_, i) => `Owner ${i + 1}`);
}

function defaultProtectedPlayers(): ProtectedPlayer[][] {
  return Array.from({ length: NUM_OWNERS }, () => []);
}

interface AppContextValue {
  // setup data (persists across setup <-> draft, used to (re)build a DraftState)
  ownerNames: string[];
  setOwnerNames: (names: string[]) => void;
  protectedPlayers: ProtectedPlayer[][];
  setProtectedPlayers: (p: ProtectedPlayer[][]) => void;
  fifthPos: number;
  setFifthPos: (i: number) => void;

  // navigation
  screen: Screen;
  setScreen: (s: Screen) => void;
  setupTab: SetupTab;
  setSetupTab: (t: SetupTab) => void;

  // randomizer (standalone utility, separate from ownerNames used for live draft order)
  randOrder: string[] | null;
  setRandOrder: (o: string[] | null) => void;

  // draft engine state
  draft: DraftState | null;
  dispatchDraft: React.Dispatch<DraftAction>;
  startDraft: () => void;
  resumeDraft: () => void;
  softReset: () => void;
  hardReset: () => void;
  resumeBannerVisible: boolean;

  // who-am-i / research
  myOwnerIdx: number;
  setMyOwnerIdx: (i: number) => void;
  whoAmIOpen: boolean;
  setWhoAmIOpen: (v: boolean) => void;
  rightSidebarOpen: boolean;
  setRightSidebarOpen: (v: boolean) => void;

  // reset modal
  resetModalOpen: boolean;
  setResetModalOpen: (v: boolean) => void;

  // toast
  toast: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ownerNames, setOwnerNames] = useState<string[]>(defaultOwnerNames());
  const [protectedPlayers, setProtectedPlayers] = useState<ProtectedPlayer[][]>(defaultProtectedPlayers());
  const [fifthPos, setFifthPos] = useState(0);

  const [screen, setScreen] = useState<Screen>("setup");
  const [setupTab, setSetupTab] = useState<SetupTab>("order");
  const [randOrder, setRandOrder] = useState<string[] | null>(null);

  const [draft, dispatchDraft] = useReducer(draftReducer, null);
  const [resumeBannerVisible, setResumeBannerVisible] = useState(false);

  const [myOwnerIdx, setMyOwnerIdx] = useState(0);
  const [whoAmIOpen, setWhoAmIOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // surface toasts emitted by the draft engine reducer
  useEffect(() => {
    if (draft?.lastToast) {
      showToast(draft.lastToast);
      dispatchDraft({ type: "DISMISS_TOAST" });
    }
  }, [draft?.lastToast, showToast]);

  const startDraft = useCallback(() => {
    const newDraft = createDraftState(ownerNames, protectedPlayers, fifthPos);
    dispatchDraft({ type: "INIT", state: newDraft });
    setScreen("draft");
    setResumeBannerVisible(false);
    setWhoAmIOpen(true);
  }, [ownerNames, protectedPlayers, fifthPos]);

  const resumeDraft = useCallback(() => {
    if (!draft) return;
    setScreen("draft");
    setWhoAmIOpen(true);
  }, [draft]);

  const softReset = useCallback(() => {
    setResetModalOpen(false);
    setScreen("setup");
    if (draft) setResumeBannerVisible(true);
  }, [draft]);

  const hardReset = useCallback(() => {
    if (!window.confirm("This will permanently wipe the entire draft. Are you absolutely sure?")) return;
    setResetModalOpen(false);
    dispatchDraft({ type: "RESET" });
    setOwnerNames(defaultOwnerNames());
    setProtectedPlayers(defaultProtectedPlayers());
    setFifthPos(0);
    setScreen("setup");
    setSetupTab("order");
    setResumeBannerVisible(false);
    showToast("Draft wiped");
  }, [showToast]);

  const value: AppContextValue = {
    ownerNames,
    setOwnerNames,
    protectedPlayers,
    setProtectedPlayers,
    fifthPos,
    setFifthPos,
    screen,
    setScreen,
    setupTab,
    setSetupTab,
    randOrder,
    setRandOrder,
    draft,
    dispatchDraft,
    startDraft,
    resumeDraft,
    softReset,
    hardReset,
    resumeBannerVisible,
    myOwnerIdx,
    setMyOwnerIdx,
    whoAmIOpen,
    setWhoAmIOpen,
    rightSidebarOpen,
    setRightSidebarOpen,
    resetModalOpen,
    setResetModalOpen,
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
