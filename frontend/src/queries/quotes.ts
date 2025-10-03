import { mutationOptions, queryOptions, type QueryFunctionContext } from "@tanstack/react-query";
import type {
    TQuote,
    TQuoteCreateResult,
    TQuoteFilters,
    TQuoteListingResult,
    TQuotePropType,
} from "./type";
import { objectToQueryString } from "./util";

export const QuoteQueryKeys = {
    all: () => ["quotes"] as const,
    // Quote listings
    listing: () => [...QuoteQueryKeys.all(), "listing"] as const,
    filtered: (filters: TQuoteFilters) =>
        [...QuoteQueryKeys.listing(), "filtered", { filters }] as const,
    // Single quote
    detail: () => [...QuoteQueryKeys.all(), "detail"] as const,
    byId: (id: string) => [...QuoteQueryKeys.detail(), "byId", { id }] as const,

    // Mutations
    create: (propType: string) => [...QuoteQueryKeys.all(), "create", { propType }] as const,
    update: (id: string) => [...QuoteQueryKeys.all(), "update", { id }] as const,
    delete: (id: string) => [...QuoteQueryKeys.all(), "delete", { id }] as const,
} as const;

export type QKQuotesListing = ReturnType<typeof QuoteQueryKeys.listing>;
export type QKQuotesFiltered = ReturnType<typeof QuoteQueryKeys.filtered>;
export type QKQuotesById = ReturnType<typeof QuoteQueryKeys.byId>;
export type QKQuotesCreate = ReturnType<typeof QuoteQueryKeys.create>;
export type QKQuotesUpdate = ReturnType<typeof QuoteQueryKeys.update>;
export type QKQuotesDelete = ReturnType<typeof QuoteQueryKeys.delete>;

export const getQuotesOpts = (filters: TQuoteFilters) =>
    queryOptions({
        queryKey: QuoteQueryKeys.filtered(filters),
        queryFn: getQuoteListing,
    });

export async function getQuoteListing({
    queryKey,
}: QueryFunctionContext<QKQuotesFiltered>): Promise<TQuoteListingResult> {
    const { filters } = queryKey[3];
    const queryParams = objectToQueryString(filters);
    let url = "/api/citas";

    if (queryParams.length > 0) {
        url += "?" + queryParams;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.message || "Error al obtener las citas");
    }

    return data;
}

export const createQuoteOpts = (propType: TQuotePropType) => mutationOptions({
    mutationKey: QuoteQueryKeys.create(propType),
    mutationFn: createQuote,
})

export async function createQuote(newQuote: TQuote): Promise<TQuoteCreateResult> {
    const response = await fetch("/api/citas", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(newQuote),
    });
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Error al crear cita");
    }

    return data;
}
