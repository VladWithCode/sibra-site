import { mutationOptions, queryOptions } from "@tanstack/react-query";
import type { TMediaAsset } from "@/lib/media";
import { PropertyQueryKeys } from "./properties";
import { queryClient } from "./queryClient";
import type { TPropertyMedia } from "./type";

/** Panel view of a property's media, including items still encoding. */
export type TPropertyMediaState = {
    mainImage: TMediaAsset | null;
    media: TPropertyMedia[];
};

/** Limits mirrored from the backend (internal/media) for fast feedback. */
export const MEDIA_LIMITS = {
    videoBytes: 500 * 1024 * 1024,
    imageBytes: 25 * 1024 * 1024,
    videoSeconds: 180,
    imageTypes: ["image/jpeg", "image/png", "image/webp"],
    videoTypes: ["video/mp4", "video/quicktime", "video/webm"],
} as const;

export const MEDIA_ACCEPT = [...MEDIA_LIMITS.imageTypes, ...MEDIA_LIMITS.videoTypes].join(",");

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

/**
 * Uploads one file with progress reporting. fetch() cannot report upload
 * progress, so this uses XMLHttpRequest. One file per request keeps every
 * request under the 500MB server limit and gives per-file errors.
 */
export function uploadWithProgress<T>(
    url: string,
    field: string,
    file: File,
    onProgress?: (fraction: number) => void,
): Promise<T> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        xhr.responseType = "json";
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress?.(e.loaded / e.total);
        };
        xhr.onload = () => {
            const data = xhr.response ?? {};
            if (xhr.status >= 200 && xhr.status < 300) resolve(data as T);
            else if (xhr.status === 413)
                reject(new Error(data.error || "El archivo es demasiado grande"));
            else reject(new Error(data.error || "No se pudo subir el archivo"));
        };
        xhr.onerror = () => reject(new Error("Se perdió la conexión durante la subida"));
        const form = new FormData();
        form.append(field, file);
        xhr.send(form);
    });
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

/** Returns a Spanish error when the file breaks a limit, before uploading it. */
export async function checkMediaFile(file: File, allowVideo: boolean): Promise<string | null> {
    const isImage = (MEDIA_LIMITS.imageTypes as readonly string[]).includes(file.type);
    const isVideo = (MEDIA_LIMITS.videoTypes as readonly string[]).includes(file.type);
    if (!isImage && !(allowVideo && isVideo)) {
        return allowVideo
            ? `${file.name}: formato no soportado (JPG, PNG, WebP, MP4, MOV o WebM)`
            : `${file.name}: solo se permiten imágenes JPG, PNG o WebP`;
    }
    if (isImage && file.size > MEDIA_LIMITS.imageBytes)
        return `${file.name}: la imagen excede 25MB`;
    if (isVideo) {
        if (file.size > MEDIA_LIMITS.videoBytes) return `${file.name}: el video excede 500MB`;
        const seconds = await videoDuration(file);
        if (seconds !== null && seconds > MEDIA_LIMITS.videoSeconds) {
            return `${file.name}: el video excede 3 minutos`;
        }
    }
    return null;
}

function videoDuration(file: File): Promise<number | null> {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const video = document.createElement("video");
        video.preload = "metadata";
        const done = (v: number | null) => {
            URL.revokeObjectURL(url);
            resolve(v);
        };
        video.onloadedmetadata = () =>
            done(Number.isFinite(video.duration) ? video.duration : null);
        // Codecs the browser cannot read (e.g. HEVC .mov): let the server decide.
        video.onerror = () => done(null);
        video.src = url;
    });
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
