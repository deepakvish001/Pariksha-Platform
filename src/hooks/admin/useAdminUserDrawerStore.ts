import { create } from "zustand";

interface AdminUserDrawerStore {
  userId: string | null;
  open: boolean;
  show: (userId: string) => void;
  hide: () => void;
  setOpen: (v: boolean) => void;
}

export const useAdminUserDrawerStore = create<AdminUserDrawerStore>((set) => ({
  userId: null,
  open: false,
  show: (userId) => set({ userId, open: true }),
  hide: () => set({ open: false }),
  setOpen: (v) => set({ open: v }),
}));
