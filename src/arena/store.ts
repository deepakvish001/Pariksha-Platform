import { create } from "zustand";
import type { Battle, BattleEvent, PlayerRating } from "./types";

interface BattleState {
  battle: Battle | null;
  events: BattleEvent[];
  opponentTyping: boolean;
  opponentPassed: number;
  opponentTotal: number;
  myPassed: number;
  myTotal: number;
  setBattle: (b: Battle | null) => void;
  pushEvent: (e: BattleEvent) => void;
  setMine: (passed: number, total: number) => void;
  reset: () => void;
}

export const useBattleStore = create<BattleState>((set) => ({
  battle: null,
  events: [],
  opponentTyping: false,
  opponentPassed: 0,
  opponentTotal: 0,
  myPassed: 0,
  myTotal: 0,
  setBattle: (b) => set({ battle: b }),
  pushEvent: (e) =>
    set((s) => {
      const next: Partial<BattleState> = { events: [...s.events.slice(-200), e] };
      if (e.kind === "typing") next.opponentTyping = true;
      if (e.kind === "submit" || e.kind === "test_run") {
        const p = (e.payload || {}) as { passed?: number; total?: number };
        if (typeof p.passed === "number") next.opponentPassed = p.passed;
        if (typeof p.total === "number") next.opponentTotal = p.total;
      }
      return { ...s, ...next };
    }),
  setMine: (passed, total) => set({ myPassed: passed, myTotal: total }),
  reset: () => set({ battle: null, events: [], opponentPassed: 0, opponentTotal: 0, myPassed: 0, myTotal: 0, opponentTyping: false }),
}));

interface ArenaProfileState {
  rating: PlayerRating | null;
  setRating: (r: PlayerRating | null) => void;
}
export const useArenaProfileStore = create<ArenaProfileState>((set) => ({
  rating: null,
  setRating: (r) => set({ rating: r }),
}));
