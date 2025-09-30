import type { QueryFunctionContext } from "@tanstack/react-query";
import type {
    TProperty,
    TPropertyDetailResult,
    TPropertyFilters,
    TPropertyListingResult,
} from "./type";
import { queryOptions } from "@tanstack/react-query";
import { objectToQueryString } from "./util";

export type TPropertyQueryFilters = TPropertyFilters;

export type TPropertyQueryConfig = {
    filters: TPropertyQueryFilters;
};

export const PropertyQueryKeys = {
    all: () => ["properties"] as const,
    // Property listings
    listing: () => [...PropertyQueryKeys.all(), "listing"] as const,
    featured: () => [...PropertyQueryKeys.listing(), "featured"] as const,
    byContract: (contract: string, filters: TPropertyQueryFilters) =>
        [...PropertyQueryKeys.listing(), "byContract", { contract, filters }] as const,
    nearby: (id: string, nearbyDistance: number) =>
        [...PropertyQueryKeys.listing(), "nearby", { id, nearbyDistance }] as const,
    nearbyByCoords: (coords: string, nearbyDistance: number) =>
        [...PropertyQueryKeys.listing(), "nearbyByCoords", { coords, nearbyDistance }] as const,
    // Single property
    detail: () => [...PropertyQueryKeys.all(), "detail"] as const,
    byId: (id: string, contract: string) =>
        [...PropertyQueryKeys.detail(), "byId", { id, contract }] as const,
    bySlug: (slug: string, contract: string) =>
        [...PropertyQueryKeys.detail(), "bySlug", { slug, contract }] as const,
} as const;

// Type helpers for queryFns to recognize the queryKey type
export type QKPropertiesFeatured = ReturnType<typeof PropertyQueryKeys.featured>;
export type QKPropertyByContract = ReturnType<typeof PropertyQueryKeys.byContract>;
export type QKPropertiesNearby = ReturnType<typeof PropertyQueryKeys.nearby>;
export type QKPropertyById = ReturnType<typeof PropertyQueryKeys.byId>;
export type QKPropertyBySlug = ReturnType<typeof PropertyQueryKeys.bySlug>;

export const getPropertiesOpts = queryOptions({
    queryKey: PropertyQueryKeys.featured(),
    queryFn: getFeaturedProperties,
});

export const getPropertyListingOpts = (filters: TPropertyFilters) =>
    queryOptions({
        queryKey: PropertyQueryKeys.byContract(filters.contract, filters),
        queryFn: getPropertiesByContract,
    });

export const getPropertyByIdOpts = (id: string, contract: string) =>
    queryOptions({
        queryKey: PropertyQueryKeys.byId(id, contract),
        queryFn: getPropertyById,
    });

export const getPropertyBySlugOpts = (slug: string, contract: string) =>
    queryOptions({
        queryKey: PropertyQueryKeys.bySlug(slug, contract),
        queryFn: getPropertyBySlug,
    });

export const ErrFailedToFetchProperties = new Error("Error al obtener las propiedades"),
    ErrFailedToFetchPropertyDetail = new Error("Error al obtener detalles de la propiedad");

export async function getFeaturedProperties(): Promise<TProperty[]> {
    const response = await fetch("/api/propiedades/destacadas");
    const data = await response.json();

    return data.properties;
}

export async function getPropertiesByContract({
    queryKey,
}: QueryFunctionContext<QKPropertyByContract>): Promise<TPropertyListingResult> {
    const params = queryKey[3];
    const queryParams = objectToQueryString(params.filters);

    let url = "/api/propiedades/" + params.contract;
    if (queryParams.length > 0) {
        url += "?" + queryParams;
    }

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        return await response.json();
    } catch (e) {
        console.error(e);
        throw new Error("Error al obtener las propiedades");
    }
}

export async function getPropertyById({
    queryKey,
}: QueryFunctionContext<QKPropertyById>): Promise<TPropertyDetailResult> {
    const { id, contract } = queryKey[3];
    const response = await fetch(`/api/propiedades/${contract}/${id}`);
    if (!response.ok) throw new Error("Error al obtener la propiedad");
    const data = await response.json();
    return data.property;
}

export async function getPropertyBySlug({
    queryKey,
}: QueryFunctionContext<QKPropertyBySlug>): Promise<TPropertyDetailResult> {
    const { slug, contract } = queryKey[3];
    const response = await fetch(`/api/propiedades/${contract}/${slug}`);
    if (!response.ok) throw new Error("Error al obtener la propiedad");

    const data = await response.json();
    return data;
}
