import { useSyncExternalStore } from "react";

type State = { userId: string | null; open: boolean };

let state: State = { userId: null, open: false };
const listeners = new Set<() => void>();

const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const getSnapshot = () => state;

export const adminUserDrawer = {
  show: (userId: string) => set({ userId, open: true }),
  hide: () => set({ open: false }),
  setOpen: (open: boolean) => set({ open }),
};

export const useAdminUserDrawerStore = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
