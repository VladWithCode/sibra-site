import type { QueryFunctionContext } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import type { TRequestFilters, TRequestListingResult } from "./type";
import { objectToQueryString } from "./util";

export const RequestQueryKeys = {
    all: () => ["requests"] as const,
    listing: () => [...RequestQueryKeys.all(), "listing"] as const,
    filtered: (filters: Partial<TRequestFilters>) =>
        [...RequestQueryKeys.listing(), "filtered", { filters }] as const,
} as const;

export type QKRequestsFiltered = ReturnType<typeof RequestQueryKeys.filtered>;

const EMPTY_RESULT: TRequestListingResult = {
    requests: [],
    pagination: { total: 0, page: 1, perPage: 10, hasNext: false, hasPrev: false },
};

export const getRequestFilteredListingOpts = (filters: Partial<TRequestFilters>) =>
    queryOptions({
        queryKey: RequestQueryKeys.filtered(filters),
        queryFn: getRequestsFiltered,
    });

async function getRequestsFiltered({
    queryKey,
}: QueryFunctionContext<QKRequestsFiltered>): Promise<TRequestListingResult> {
    try {
        const qs = objectToQueryString(queryKey[3].filters);
        const response = await fetch("/api/solicitudes?" + qs);

        if (response.status === 404) return EMPTY_RESULT;
        if (!response.ok) throw new Error("Error al obtener las solicitudes");

        return await response.json();
    } catch {
        return EMPTY_RESULT;
    }
}
