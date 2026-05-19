import { create } from "zustand";

export type TUIStore = {
    headerFloating: boolean;
    headerComplement: "none" | "search" | "cta" | "project";
    headerComplementProps: THeaderComplementProps;
    headerQuickStick: boolean;
    headerHidden: boolean;

    setHeaderFloating: (value: boolean) => void;
    setHeaderComplement: (value: TUIStore["headerComplement"]) => void;
    setHeaderComplementProps: (props: THeaderComplementProps) => void;
    setHeaderQuickStick: (value: boolean) => void;
    setHeaderHidden: (value: boolean) => void;
};

export const useUIStore = create<TUIStore>((set) => ({
    headerFloating: true,
    headerComplement: "none",
    headerComplementProps: { complementType: "none" },
    headerQuickStick: false,
    headerHidden: false,

    setHeaderFloating: (value: boolean) => set({ headerFloating: value }),
    setHeaderComplement: (value: TUIStore["headerComplement"]) =>
        set({ headerComplement: value }),
    setHeaderComplementProps: (props: THeaderComplementProps) => { set({ headerComplementProps: props }); console.log("props", props) },
    setHeaderQuickStick: (value: boolean) => set({ headerQuickStick: value }),
    setHeaderHidden: (value: boolean) => set({ headerHidden: value }),
}));

export type THeaderComplementProps = THeaderComplementNoneProps | THeaderComplementSearchProps | THeaderComplementCtaProps | THeaderComplementProjectProps;

type THeaderComplementSearchProps = {
    complementType: "search";
}

type THeaderComplementCtaProps = {
    complementType: "cta";
}

type THeaderComplementProjectProps = {
    complementType: "project";
    projectName: string;
}

type THeaderComplementNoneProps = {
    complementType: "none";
}

