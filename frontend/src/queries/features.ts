import type { QueryFunctionContext } from "@tanstack/react-query";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import type { TPropertyFeature } from "./type";
import { queryClient } from "./queryClient";

export const FeatureQueryKeys = {
    all: () => ["features"] as const,
    listing: () => [...FeatureQueryKeys.all(), "listing"] as const,
    detail: (id: string) => [...FeatureQueryKeys.all(), "detail", { id }] as const,
} as const;

export type QKFeatureListing = ReturnType<typeof FeatureQueryKeys.listing>;
export type QKFeatureDetail = ReturnType<typeof FeatureQueryKeys.detail>;

export const getFeaturesOpts = queryOptions({
    queryKey: FeatureQueryKeys.listing(),
    queryFn: getFeatures,
});

export const getFeatureByIdOpts = (id: string) =>
    queryOptions({
        queryKey: FeatureQueryKeys.detail(id),
        queryFn: getFeatureById,
    });

export const createFeatureOpts = () =>
    mutationOptions({
        mutationKey: FeatureQueryKeys.listing(),
        mutationFn: createFeature,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: FeatureQueryKeys.listing(),
            });
        },
    });

export const updateFeatureOpts = (id: string) =>
    mutationOptions({
        mutationKey: FeatureQueryKeys.detail(id),
        mutationFn: updateFeature,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: FeatureQueryKeys.all(),
            });
        },
    });

export const deleteFeatureOpts = () =>
    mutationOptions({
        mutationKey: FeatureQueryKeys.listing(),
        mutationFn: deleteFeature,
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: FeatureQueryKeys.listing(),
            });
        },
    });

export async function getFeatures(): Promise<TPropertyFeature[]> {
    const response = await fetch("/api/features");
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error al obtener las características");
    }

    return data.features;
}

export async function getFeatureById({
    queryKey,
}: QueryFunctionContext<QKFeatureDetail>): Promise<TPropertyFeature> {
    const { id } = queryKey[2];
    const response = await fetch(`/api/features/${id}`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error al obtener la característica");
    }

    return data.feature;
}

export async function createFeature(feature: Partial<TPropertyFeature>): Promise<TPropertyFeature> {
    const response = await fetch("/api/features", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(feature),
    });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error al crear la característica");
    }

    return data.feature;
}

export async function updateFeature(feature: Partial<TPropertyFeature> & { id: string }): Promise<TPropertyFeature> {
    const response = await fetch(`/api/features/${feature.id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(feature),
    });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error al actualizar la característica");
    }

    return data.feature;
}

export async function deleteFeature({ id }: { id: string }): Promise<{ success: boolean }> {
    const response = await fetch(`/api/features/${id}`, {
        method: "DELETE",
    });
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error al eliminar la característica");
    }

    return data;
}
