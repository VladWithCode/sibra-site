import { getPropertyFilteredListingOpts } from "@/queries/properties";
import type { TProject, TProperty } from "@/queries/type";
import { useQuery, type QueryStatus } from "@tanstack/react-query";
import { create } from "zustand";

type SavedPropertiesStore = {
    savedPropertyIDs: string[];
    savedProjects: TProject[];

    checkPropertyLike: (id: string) => boolean;
    checkProjectLike: (slug: string) => boolean;

    setProperties: (ids: string[]) => void;
    addProperty: (id: string) => void;
    removeProperty: (id: string) => void;
    setProjects: (projects: TProject[]) => void;
    addProject: (project: TProject) => void;
    removeProject: (project: TProject) => void;

    clear: () => void;
};

export const useSavedPropertiesStore = create<SavedPropertiesStore>((set, get) => {
    const storedIds = localStorage.getItem("savedProperties");
    const storedProjects = localStorage.getItem("savedProjects");
    const initialIds = storedIds ? JSON.parse(storedIds) : [];
    const initialProjects = storedProjects ? JSON.parse(storedProjects) : [];

    return {
        savedPropertyIDs: initialIds,
        savedProjects: initialProjects,

        checkPropertyLike: (id: string) => {
            return get().savedPropertyIDs.includes(id)
        },
        setProperties: (ids: string[]) => {
            set(() => ({
                savedPropertyIDs: ids,
            }));
            localStorage.setItem("savedProperties", JSON.stringify(ids));
        },
        addProperty: (id: string) => {
            if (get().checkPropertyLike(id)) {
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
        checkProjectLike: (slug: string) => {
            return get().savedProjects.some((project) => project.slug === slug)
        },
        setProjects: (projects: TProject[]) => {
            set(() => ({
                savedProjects: projects,
            }));
            localStorage.setItem("savedProjects", JSON.stringify(projects));
        },
        addProject: (project: TProject) => {
            if (get().checkProjectLike(project.slug)) {
                return;
            }

            set((state) => ({
                savedProjects: [...state.savedProjects, project],
            }));
            localStorage.setItem("savedProjects", JSON.stringify(get().savedProjects));
        },
        removeProject: (project: TProject) => {
            set((state) => ({
                savedProjects: state.savedProjects.filter((savedProject) => savedProject.slug !== project.slug),
            }));
            localStorage.setItem("savedProjects", JSON.stringify(get().savedProjects));
        },

        clear: () => {
            set(() => ({
                savedPropertyIDs: [],
                savedProjects: [],
            }));
            localStorage.setItem("savedProperties", "");
            localStorage.setItem("savedProjects", "[]");
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
