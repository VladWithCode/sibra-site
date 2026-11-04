import { mutationOptions, queryOptions } from "@tanstack/react-query";
import type { TMediaAsset } from "@/lib/media";
import { PropertyQueryKeys } from "./properties";
import { queryClient } from "./queryClient";
import type { TPropertyMedia } from "./type";
import { uploadWithProgress } from "./mediaUpload";

/** Panel view of a property's media, including items still encoding. */
export type TPropertyMediaState = {
    mainImage: TMediaAsset | null;
    media: TPropertyMedia[];
};

export const PropertyMediaKeys = {
    state: (id: string) => [...PropertyQueryKeys.all(), "media", { id }] as const,
};

async function jsonOrThrow<T>(response: Response, fallback: string): Promise<T> {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || fallback);
    return data as T;
}

async function getPropertyMediaState(id: string): Promise<TPropertyMediaState> {
    const response = await fetch(`/api/property/${id}/media`);
    return jsonOrThrow(response, "No se pudo cargar la galería");
}

const isEncoding = (a: TMediaAsset | null | undefined) =>
    !!a && (a.status === "pending" || a.status === "processing");

export const getPropertyMediaOpts = (id: string) =>
    queryOptions({
        queryKey: PropertyMediaKeys.state(id),
        queryFn: () => getPropertyMediaState(id),
        // Poll while anything is still encoding.
        refetchInterval: (query) => {
            const data = query.state.data;
            if (!data) return false;
            const busy =
                isEncoding(data.mainImage) || data.media.some((m) => isEncoding(m.asset));
            return busy ? 3000 : false;
        },
    });

function invalidatePropertyMedia(id: string) {
    queryClient.invalidateQueries({ queryKey: PropertyMediaKeys.state(id) });
    queryClient.invalidateQueries({ queryKey: PropertyQueryKeys.single(id) });
}

export function uploadPropertyMediaFile(
    id: string,
    file: File,
    onProgress?: (f: number) => void,
) {
    return uploadWithProgress<{ media: TPropertyMedia[] }>(
        `/api/property/${id}/media`,
        "files",
        file,
        onProgress,
    ).finally(() => invalidatePropertyMedia(id));
}

export function uploadPropertyMainImage(
    id: string,
    file: File,
    onProgress?: (f: number) => void,
) {
    return uploadWithProgress<{ assetId: string }>(
        `/api/property/${id}/main-image`,
        "file",
        file,
        onProgress,
    ).finally(() => invalidatePropertyMedia(id));
}

async function sendJSON(url: string, method: string, body?: unknown) {
    const response = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    return jsonOrThrow<{ success: boolean }>(response, "Ocurrió un error inesperado");
}

export const reorderPropertyMediaOpts = (id: string) =>
    mutationOptions({
        mutationFn: (ids: string[]) =>
            sendJSON(`/api/property/${id}/media/order`, "PUT", { ids }),
        onSettled: () => invalidatePropertyMedia(id),
    });

export const setPropertyCoverOpts = (id: string) =>
    mutationOptions({
        mutationFn: ({ mediaId, isCover }: { mediaId: string; isCover: boolean }) =>
            sendJSON(`/api/property/${id}/media/${mediaId}`, "PATCH", { isCover }),
        onSettled: () => invalidatePropertyMedia(id),
    });

export const deletePropertyMediaOpts = (id: string) =>
    mutationOptions({
        mutationFn: (mediaId: string) =>
            sendJSON(`/api/property/${id}/media/${mediaId}`, "DELETE"),
        onSettled: () => invalidatePropertyMedia(id),
    });

export const deletePropertyMainImageOpts = (id: string) =>
    mutationOptions({
        mutationFn: () => sendJSON(`/api/property/${id}/main-image`, "DELETE"),
        onSettled: () => invalidatePropertyMedia(id),
    });
