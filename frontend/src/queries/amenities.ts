import type { QueryFunctionContext } from "@tanstack/react-query";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import type { TPropertyAmenity } from "./type";
import { queryClient } from "./queryClient";

export const AmenityQueryKeys = {
    all: () => ["amenities"] as const,
    listing: () => [...AmenityQueryKeys.all(), "listing"] as const,
    detail: (id: string) => [...AmenityQueryKeys.all(), "detail", { id }] as const,
} as const;

export type QKAmenityListing = ReturnType<typeof AmenityQueryKeys.listing>;
export type QKAmenityDetail = ReturnType<typeof AmenityQueryKeys.detail>;

export const getAmenitiesOpts = queryOptions({
    queryKey: AmenityQueryKeys.listing(),
    queryFn: getAmenities,
});

export const getAmenityByIdOpts = (id: string) =>
    queryOptions({
        queryKey: AmenityQueryKeys.detail(id),
        queryFn: getAmenityById,
    });

export const createAmenityOpts = () =>
    mutationOptions({
        mutationKey: AmenityQueryKeys.listing(),
        mutationFn: createAmenity,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: AmenityQueryKeys.listing(),
            });
        },
    });

export const updateAmenityOpts = (id: string) =>
    mutationOptions({
        mutationKey: AmenityQueryKeys.detail(id),
        mutationFn: updateAmenity,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: AmenityQueryKeys.all(),
            });
        },
    });

export const deleteAmenityOpts = () =>
    mutationOptions({
        mutationKey: AmenityQueryKeys.listing(),
        mutationFn: deleteAmenity,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: AmenityQueryKeys.listing(),
            });
        },
    });

export async function getAmenities(): Promise<TPropertyAmenity[]> {
    const response = await fetch("/api/amenities");
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error al obtener las amenidades");
    }

    return data.amenities;
}

export async function getAmenityById({
    queryKey,
}: QueryFunctionContext<QKAmenityDetail>): Promise<TPropertyAmenity> {
    const { id } = queryKey[2];
    const response = await fetch(`/api/amenities/${id}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error al obtener la amenidad");
    }

    return data.amenity;
}

export async function createAmenity(amenity: Partial<TPropertyAmenity>): Promise<TPropertyAmenity> {
    const response = await fetch("/api/amenities", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(amenity),
    });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error al crear la amenidad");
    }

    return data.amenity;
}

export async function updateAmenity(amenity: Partial<TPropertyAmenity> & { id: string }): Promise<TPropertyAmenity> {
    const response = await fetch(`/api/amenities/${amenity.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(amenity),
    });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error al actualizar la amenidad");
    }

    return data.amenity;
}

export async function deleteAmenity({ id }: { id: string }): Promise<{ success: boolean }> {
    const response = await fetch(`/api/amenities/${id}`, {
        method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error al eliminar la amenidad");
    }

    return data;
}
