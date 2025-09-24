import type { QueryFunctionContext } from "@tanstack/react-query";
import type { TProperty, TPropertyFilters } from "./type";
import { queryOptions } from "@tanstack/react-query";

export type TPropertyQueryFilters = TPropertyFilters

export type TPropertyQueryConfig = {
    filters: TPropertyQueryFilters;
}

export const PropertyQueryKeys = {
    all: () => ["properties"],
    listing: () => [...PropertyQueryKeys.all(), "listing"],
    featured: () => [...PropertyQueryKeys.listing(), "featured"],
    byContract: (contract: string, filters: TPropertyQueryFilters) => [
        ...PropertyQueryKeys.listing(),
        "byContract",
        { contract, filters },
    ],
    nearby: (id: string, nearbyDistance: number) => [
        ...PropertyQueryKeys.listing(),
        "nearby",
        { id, nearbyDistance },
    ],
    nearbyByCoords: (coords: string, nearbyDistance: number) => [
        ...PropertyQueryKeys.listing(),
        "nearbyByCoords",
        { coords, nearbyDistance },
    ],
    detail: () => [...PropertyQueryKeys.all(), "detail"],
    byId: (id: string) => [
        ...PropertyQueryKeys.detail(),
        "byId",
        { id },
    ],
    bySlug: (slug: string) => [
        ...PropertyQueryKeys.detail(),
        "bySlug",
        { slug },
    ],
};

export const getPropertiesOpts = queryOptions({
    queryKey: PropertyQueryKeys.featured(),
    queryFn: getFeaturedProperties,
});

export const getPropertyListingOpts = (filters: TPropertyFilters) => queryOptions({
    queryKey: PropertyQueryKeys.byContract(filters.contract, filters),
    queryFn: getPropertyListing,
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

export async function getPropertyListing({ queryKey }: QueryFunctionContext): Promise<TProperty[]> {
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

export async function getPropertyById({ queryKey }: QueryFunctionContext): Promise<TProperty> {

    const response = await fetch(`/api/propiedades/${id}`);
    if (!response.ok) throw new Error("Error al obtener la propiedad");
    const data = await response.json();
    return data.property;
}

