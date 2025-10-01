import { getPropertyFilteredListingOpts } from "@/queries/properties";
import type { TProperty } from "@/queries/type";
import { useQuery, type QueryStatus } from "@tanstack/react-query";
import { useEffect } from "react";
import { create } from "zustand";

type SavedPropertiesStore = {
    savedPropertyIDs: string[];
    isLiked: (id: string) => boolean;
    setProperties: (ids: string[]) => void;
    addProperty: (id: string) => void;
    removeProperty: (id: string) => void;
    clear: () => void;
};

export const useSavedPropertiesStore = create<SavedPropertiesStore>((set, get) => {
    const storedIds = localStorage.getItem("savedProperties");
    const initialIds = storedIds ? JSON.parse(storedIds) : [];

    return {
        savedPropertyIDs: initialIds,

        isLiked: (id: string) => {
            return get().savedPropertyIDs.includes(id)
        },
        setProperties: (ids: string[]) => {
            set(() => ({
                savedPropertyIDs: ids,
            }));
            localStorage.setItem("savedProperties", JSON.stringify(ids));
        },
        addProperty: (id: string) => {
            if (get().isLiked(id)) {
                return;
            }

            set((state) => ({
                savedPropertyIDs: [...state.savedPropertyIDs, id],
            }));
            localStorage.setItem("savedProperties", JSON.stringify(get().savedPropertyIDs));
        },
        removeProperty: (id: string) => {
            set((state) => ({
                savedPropertyIDs: state.savedPropertyIDs.filter((savedId) => savedId !== id),
            }));
            localStorage.setItem("savedProperties", JSON.stringify(get().savedPropertyIDs));
        },
        clear: () => {
            set(() => ({
                savedPropertyIDs: [],
            }));
            localStorage.setItem("savedProperties", "");
        },
    }
});

export type TSavedProperties = {
    properties: TProperty[];
    status: QueryStatus;
} & SavedPropertiesStore;

export const useSavedProperties = () => {
    const store = useSavedPropertiesStore();
    const { data, status } = useQuery(getPropertyFilteredListingOpts({
        ids: store.savedPropertyIDs,
    }));

    return {
        ...store,
        properties: data?.properties || [],
        status,
    } as TSavedProperties;
}
