import { mutationOptions, queryOptions, type QueryFunctionContext } from "@tanstack/react-query";
import type {
    TUserFilters,
    TUserListingResult,
    TUserDeleteResult,
    TUserDetailResult,
    TUserCreateResult,
    TUserUpdateResult,
    TAgentListingResult,
} from "./type";
import { queryClient } from "./queryClient";
import { objectToQueryString } from "./util";

export const UserQueryKeys = {
    all: () => ["users"] as const,
    listing: () => [...UserQueryKeys.all(), "listing"] as const,
    filtered: (filters: TUserFilters) =>
        [...UserQueryKeys.listing(), "filtered", { filters }] as const,
    agents: () => [...UserQueryKeys.listing(), "agents"] as const,
    detail: () => [...UserQueryKeys.all(), "detail"] as const,
    byId: (id: string) => [...UserQueryKeys.detail(), "byId", { id }] as const,
    delete: (id: string) => [...UserQueryKeys.all(), "delete", { id }] as const,
} as const;

export type QKUsersListing = ReturnType<typeof UserQueryKeys.listing>;
export type QKUsersFiltered = ReturnType<typeof UserQueryKeys.filtered>;
export type QKUsersById = ReturnType<typeof UserQueryKeys.byId>;
export type QKUsersDelete = ReturnType<typeof UserQueryKeys.delete>;

export async function getUserListing({ queryKey }: QueryFunctionContext<QKUsersFiltered>): Promise<TUserListingResult> {
    const { filters } = queryKey[3];
    const queryParams = objectToQueryString(filters);
    let url = "/api/usuarios";

    if (queryParams.length > 0) {
        url += "?" + queryParams;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.message || "Error al obtener los usuarios");
    }

    return data;
}

export async function getAgentListing(): Promise<TUserListingResult> {
    const response = await fetch("/api/usuarios/agentes");
    const data = await response.json();
    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.message || "Error al obtener los usuarios");
    }
    return data;
}

async function getUserById({ queryKey }: QueryFunctionContext<QKUsersById>): Promise<TUserDetailResult> {
    const { id } = queryKey[3];
    const response = await fetch(`/api/usuarios/${id}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Error al obtener el usuario");
    return data;
}

export const getUsersOpts = (filters: TUserFilters) =>
    queryOptions({
        queryKey: UserQueryKeys.filtered(filters),
        queryFn: getUserListing,
    });

export const getAgentsOpts = () =>
    queryOptions({
        queryKey: UserQueryKeys.agents(),
        queryFn: getAgents,
    });

export async function getAgents(): Promise<TAgentListingResult> {
    const response = await fetch("/api/usuarios/agentes");
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.message || "Error al obtener los usuarios");
    }

    return data;
}

export const getUserByIdOpts = (id: string) =>
    queryOptions({
        queryKey: UserQueryKeys.byId(id),
        queryFn: getUserById,
    });

export const createUserOpts = () =>
    mutationOptions({
        mutationKey: [...UserQueryKeys.all(), "create"],
        mutationFn: async (payload: Record<string, unknown>): Promise<TUserCreateResult> => {
            const response = await fetch("/api/usuario", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Error al crear el usuario");
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UserQueryKeys.listing() });
        },
    });

export const updateUserOpts = (id: string) =>
    mutationOptions({
        mutationKey: UserQueryKeys.byId(id),
        mutationFn: async (payload: Record<string, unknown>): Promise<TUserUpdateResult> => {
            const response = await fetch(`/api/usuarios/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Error al actualizar el usuario");
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UserQueryKeys.byId(id) });
            queryClient.invalidateQueries({ queryKey: UserQueryKeys.listing() });
        },
    });

export const deleteUserOpts = (id: string) =>
    mutationOptions({
        mutationKey: UserQueryKeys.delete(id),
        mutationFn: async (_vars: { id: string }): Promise<TUserDeleteResult> => {
            const response = await fetch(`/api/usuario/${id}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Error al eliminar el usuario");
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: UserQueryKeys.listing(),
            });
        },
    });

export const uploadUserImageOpts = (id: string) =>
    mutationOptions({
        mutationKey: [...UserQueryKeys.byId(id), "upload-image"],
        mutationFn: async ({ file }: { file: File }): Promise<TUserUpdateResult> => {
            const fd = new FormData();
            fd.append("file", file);
            const response = await fetch(`/api/usuarios/${id}/imagen`, {
                method: "PUT",
                body: fd,
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Error al subir la imagen");
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UserQueryKeys.byId(id) });
            queryClient.invalidateQueries({ queryKey: UserQueryKeys.listing() });
        },
    });

export const deleteUserImageOpts = (id: string) =>
    mutationOptions({
        mutationKey: [...UserQueryKeys.byId(id), "delete-image"],
        mutationFn: async (): Promise<{ success: true }> => {
            const response = await fetch(`/api/usuarios/${id}/imagen`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Error al eliminar la imagen");
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: UserQueryKeys.byId(id) });
            queryClient.invalidateQueries({ queryKey: UserQueryKeys.listing() });
        },
    });
