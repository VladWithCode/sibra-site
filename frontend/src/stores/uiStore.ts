import { create } from "zustand";

export type TUIStore = {
    headerFloating: boolean;
    headerComplement: "none" | "search" | "cta";
    setHeaderFloating: (value: boolean) => void;
    setHeaderComplement: (value: TUIStore["headerComplement"]) => void;
};

export const useUIStore = create<TUIStore>((set) => ({
    headerFloating: true,
    headerComplement: "none",

    setHeaderFloating: (value: boolean) => set({ headerFloating: value }),
    setHeaderComplement: (value: TUIStore["headerComplement"]) =>
        set({ headerComplement: value }),
}));
