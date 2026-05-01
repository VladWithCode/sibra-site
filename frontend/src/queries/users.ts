import { mutationOptions, queryOptions, type QueryFunctionContext } from "@tanstack/react-query";
import type { TUserFilters, TUserListingResult, TUserDeleteResult } from "./type";
import { queryClient } from "./queryClient";
import { objectToQueryString } from "./util";

export const UserQueryKeys = {
    all: () => ["users"] as const,
    listing: () => [...UserQueryKeys.all(), "listing"] as const,
    filtered: (filters: TUserFilters) =>
        [...UserQueryKeys.listing(), "filtered", { filters }] as const,
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

export const getUsersOpts = (filters: TUserFilters) =>
    queryOptions({
        queryKey: UserQueryKeys.filtered(filters),
        queryFn: getUserListing,
    });

export const deleteUserOpts = (id: string) =>
    mutationOptions({
        mutationKey: UserQueryKeys.delete(id),
        mutationFn: async (_vars: { id: string }): Promise<TUserDeleteResult> => {
            throw new Error("Funcionalidad no disponible todavía");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: UserQueryKeys.listing(),
            });
        },
    });
