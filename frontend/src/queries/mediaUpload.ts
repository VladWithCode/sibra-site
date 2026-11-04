/** Upload helpers shared by every media upload in the panel. */

/** Limits mirrored from the backend (internal/media) for fast feedback. */
export const MEDIA_LIMITS = {
    videoBytes: 500 * 1024 * 1024,
    imageBytes: 25 * 1024 * 1024,
    videoSeconds: 180,
    imageTypes: ["image/jpeg", "image/png", "image/webp"],
    videoTypes: ["video/mp4", "video/quicktime", "video/webm"],
} as const;

export const MEDIA_ACCEPT = [...MEDIA_LIMITS.imageTypes, ...MEDIA_LIMITS.videoTypes].join(",");

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
    method: "POST" | "PUT" = "POST",
): Promise<T> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
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
