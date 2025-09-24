import type { QueryFunctionContext } from "@tanstack/react-query";
import type { TProperty, TPropertyFilters } from "./type";
import { queryOptions } from "@tanstack/react-query";

export type TPropertyQueryFilters = TPropertyFilters

export type TPropertyQueryConfig = {
    filters: TPropertyQueryFilters;
}

export const PropertyQueryKeys = {
    all: () => ["properties"] as const,
    listing: () => [...PropertyQueryKeys.all(), "listing"] as const,
    featured: () => [...PropertyQueryKeys.listing(), "featured"] as const,
    byContract: (contract: string, filters: TPropertyQueryFilters) => [
        ...PropertyQueryKeys.listing(),
        "byContract",
        { contract, filters },
    ] as const,
    nearby: (id: string, nearbyDistance: number) => [
        ...PropertyQueryKeys.listing(),
        "nearby",
        { id, nearbyDistance },
    ] as const,
    nearbyByCoords: (coords: string, nearbyDistance: number) => [
        ...PropertyQueryKeys.listing(),
        "nearbyByCoords",
        { coords, nearbyDistance },
    ] as const,
    detail: () => [...PropertyQueryKeys.all(), "detail"] as const,
    byId: (id: string) => [
        ...PropertyQueryKeys.detail(),
        "byId",
        { id },
    ] as const,
    bySlug: (slug: string) => [
        ...PropertyQueryKeys.detail(),
        "bySlug",
        { slug },
    ] as const,
} as const;

// Type helpers for queryFns to recognize the queryKey type
type QKPropertiesFeatured = ReturnType<typeof PropertyQueryKeys.featured>;
type QKPropertyByContract = ReturnType<typeof PropertyQueryKeys.byContract>;
type QKPropertyById = ReturnType<typeof PropertyQueryKeys.byId>;

export const getPropertiesOpts = queryOptions({
    queryKey: PropertyQueryKeys.featured(),
    queryFn: getFeaturedProperties,
});

export const getPropertyListingOpts = (filters: TPropertyFilters) => queryOptions({
    queryKey: PropertyQueryKeys.byContract(filters.contract, filters),
    queryFn: getPropertiesByContract,
});

export const ErrFailedToFetchProperties = new Error("Error al obtener las propiedades"),
    ErrFailedToFetchPropertyDetail = new Error("Error al obtener detalles de la propiedad");

export async function getFeaturedProperties(): Promise<TProperty[]> {
    try {
        const response = await fetch("/api/propiedades/destacadas");
        const data = await response.json();

        return data.properties;
    } catch (e) {
        console.error(e);
        throw new Error("Error al obtener las propiedades");
    }
}

export async function getPropertiesByContract({ queryKey }: QueryFunctionContext<QKPropertyByContract>): Promise<TProperty[]> {
    const params = queryKey[3];
    try {
        const response = await fetch("/api/propiedades/" + params.contract, {
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

export async function getPropertyById({ queryKey }: QueryFunctionContext<QKPropertyById>): Promise<TProperty> {
    const { id } = queryKey[3];
    const response = await fetch(`/api/propiedades/${id}`);
    if (!response.ok) throw new Error("Error al obtener la propiedad");
    const data = await response.json();
    return data.property;
}

