import type { QueryFunctionContext } from "@tanstack/react-query";
import type {
    TProperty,
    TPropertyDetailResult,
    TPropertyFilters,
    TPropertyListingResult,
} from "./type";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { objectToQueryString } from "./util";
import { queryClient } from "./queryClient";
import type z from "zod";

export type TPropertyQueryFilters = TPropertyFilters;

export type TPropertyQueryConfig = {
    filters: TPropertyQueryFilters;
};

export const PropertyQueryKeys = {
    all: () => ["properties"] as const,
    // Property listings
    listing: () => [...PropertyQueryKeys.all(), "listing"] as const,
    featured: () => [...PropertyQueryKeys.listing(), "featured"] as const,
    filtered: (filters: Partial<TPropertyQueryFilters>) =>
        [...PropertyQueryKeys.listing(), "filtered", { filters }] as const,
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
    single: (id: string) => [...PropertyQueryKeys.all(), "single", { id }] as const,
} as const;

// Type helpers for queryFns to recognize the queryKey type
export type QKPropertiesListing = ReturnType<typeof PropertyQueryKeys.listing>;
export type QKPropertiesFeatured = ReturnType<typeof PropertyQueryKeys.featured>;
export type QKPropertiesFiltered = ReturnType<typeof PropertyQueryKeys.filtered>;
export type QKPropertyByContract = ReturnType<typeof PropertyQueryKeys.byContract>;
export type QKPropertiesNearby = ReturnType<typeof PropertyQueryKeys.nearby>;
export type QKPropertyById = ReturnType<typeof PropertyQueryKeys.byId>;
export type QKPropertyBySlug = ReturnType<typeof PropertyQueryKeys.bySlug>;
export type QKPropertySingle = ReturnType<typeof PropertyQueryKeys.single>;

export const getPropertiesOpts = queryOptions({
    queryKey: PropertyQueryKeys.listing(),
    queryFn: getProperties,
});

export const getFeaturedPropertiesOpts = queryOptions({
    queryKey: PropertyQueryKeys.featured(),
    queryFn: getFeaturedProperties,
});

export const getPropertyListingOpts = (filters: TPropertyFilters) =>
    queryOptions({
        queryKey: PropertyQueryKeys.byContract(filters.contract, filters),
        queryFn: getPropertiesByContract,
    });

export const getPropertyFilteredListingOpts = (filters: Partial<TPropertyFilters>) =>
    queryOptions({
        queryKey: PropertyQueryKeys.filtered(filters),
        queryFn: getPropertiesFiltered,
    });

export const getPropertyByIdOpts = (id: string, contract: string) =>
    queryOptions({
        queryKey: PropertyQueryKeys.byId(id, contract),
        queryFn: getPropertyById,
    });

export const getSinglePropertyOpts = (id: string) =>
    queryOptions({
        queryKey: PropertyQueryKeys.single(id),
        queryFn: getSingleProperty,
    });

export const getPropertyBySlugOpts = (slug: string, contract: string) =>
    queryOptions({
        queryKey: PropertyQueryKeys.bySlug(slug, contract),
        queryFn: getPropertyBySlug,
    });

export const createPropertyOpts = () =>
    mutationOptions({
        mutationKey: PropertyQueryKeys.single("new"),
        mutationFn: createProperty,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: PropertyQueryKeys.listing(),
            });
        },
    });

export const updatePropertyDetailsOpts = (id: string) =>
    mutationOptions({
        mutationKey: PropertyQueryKeys.single(id),
        mutationFn: updateProperty,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: PropertyQueryKeys.single(id),
            });
        },
    });

export const updatePropertyMainImgOpts = (id: string) =>
    mutationOptions({
        mutationKey: PropertyQueryKeys.single(id),
        mutationFn: updatePropertyMainImg,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: PropertyQueryKeys.single(id),
            });
        },
    });

export const updatePropertyGalleryOpts = (id: string) =>
    mutationOptions({
        mutationKey: PropertyQueryKeys.single(id),
        mutationFn: updatePropertyGallery,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: PropertyQueryKeys.single(id),
            });
        },
    });

export const deletePropertyImgOpts = (id: string) =>
    mutationOptions({
        mutationKey: PropertyQueryKeys.single(id),
        mutationFn: deletePropertyImg,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: PropertyQueryKeys.single(id),
            });
        },
    });

export const deletePropertyOpts = (id: string) =>
    mutationOptions({
        mutationKey: PropertyQueryKeys.single(id),
        mutationFn: deleteProperty,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: PropertyQueryKeys.listing(),
            });
        },
    });

export const ErrFailedToFetchProperties = new Error("Error al obtener las propiedades"),
    ErrFailedToFetchPropertyDetail = new Error("Error al obtener detalles de la propiedad");


export async function getProperties(): Promise<TPropertyListingResult> {
    const response = await fetch("/api/propiedades");
    const data = await response.json();

    if (response.status === 404) {
        return {
            properties: [],
            pagination: {
                total: 0,
                page: 1,
                perPage: 10,
                hasNext: false,
                hasPrev: false,
            }
        }
    }

    if (!response.ok) {
        throw new Error(data.error || "Error al obtener las propiedades");
    }

    return data;
}

export async function getFeaturedProperties(): Promise<TProperty[]> {
    const response = await fetch("/api/propiedades/destacadas");
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Error al obtener las propiedades");
    }

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

export async function getSingleProperty({
    queryKey,
}: QueryFunctionContext<QKPropertySingle>): Promise<TPropertyDetailResult> {
    const { id } = queryKey[2];
    const response = await fetch(`/api/propiedades/panel/${id}`);
    const data = await response.json();
    if (response.status === 404) {
        throw new Error("No se encontró la propiedad");
    }
    if (!response.ok) {
        throw new Error("Error al obtener la propiedad");
    }

    return data;
}

export async function getPropertiesFiltered({
    queryKey,
}: QueryFunctionContext<QKPropertiesFiltered>): Promise<TPropertyListingResult> {
    let url = "/api/propiedades";
    const queryParams = objectToQueryString(queryKey[3].filters);

    let response = await fetch(url + "?" + queryParams.toString());
    if (!response.ok) throw new Error("Error al obtener las propiedades");
    const data = await response.json();

    return data;
}

export async function createProperty({ property }: {
    property: Partial<TProperty>;
}): Promise<TPropertyDetailResult> {
    const response = await fetch("/api/property", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(property),
    });
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Ocurrió un error al crear la propiedad");
    }

    return data;
}

export async function updateProperty(property: Partial<TProperty>): Promise<TPropertyDetailResult> {
    const response = await fetch(`/api/property/${property.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(property),
    });
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Ocurrió un error al actualizar la propiedad");
    }

    return data;
}

export async function updatePropertyMainImg({ id, file }: { id: string, file: File }): Promise<TPropertyDetailResult> {
    const formData = new FormData();
    formData.append("main-pic", file);
    const response = await fetch("/api/property/pictures/" + id, {
        method: "POST",
        body: formData,
    });
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Ocurrió un error al actualizar la propiedad");
    }

    return data;
}

export async function updatePropertyGallery({ id, files }: { id: string, files: FileList }): Promise<TPropertyDetailResult> {
    const formData = new FormData();

    for (let f of files) {
        formData.append("pics", f);
    }

    const response = await fetch("/api/property/pictures/" + id, {
        method: "POST",
        body: formData,
    });
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Ocurrió un error al actualizar la galería de fotos");
    }

    return data;
}

export async function deletePropertyImg({ id, imgName, type }: {
    id: string;
    imgName: string;
    type: "main" | "gallery";
}): Promise<{ success: boolean }> {
    const response = await fetch("/api/property/pictures/" + id, {
        method: "DELETE",
        body: JSON.stringify({
            imgName,
            type,
        }),
    });
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Ocurrió un error al eliminar la foto");
    }

    return data;
}

export async function deleteProperty({ id }: { id: string }): Promise<{ success: boolean }> {
    const response = await fetch("/api/property/" + id, {
        method: "DELETE",
    });
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Ocurrió un error al eliminar la propiedad");
    }

    return data;
}
