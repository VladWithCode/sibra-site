/**
 * Encoded media assets produced by the backend pipeline (internal/media).
 * Files live under /static/media/{id}/ with names derived from `variants`:
 *   images  -> w{width}.webp
 *   videos  -> {rendition}.mp4 (rendition = short side: 1080 or 720)
 *   poster  -> poster-w{width}.webp
 */
export type TMediaStatus = "pending" | "processing" | "ready" | "failed";

export type TMediaAsset = {
    id: string;
    kind: "image" | "video";
    status: TMediaStatus;
    error?: string;
    width: number;
    height: number;
    durationMs?: number;
    hasAudio: boolean;
    variants: {
        images?: number[];
        videos?: number[];
        poster?: number[];
    };
};

const base = (asset: TMediaAsset) => `/static/media/${asset.id}/`;

/** Widths of the still image of an asset: the image itself or the video poster. */
export function stillWidths(asset: TMediaAsset): number[] {
    return (asset.kind === "image" ? asset.variants.images : asset.variants.poster) ?? [];
}

function stillFile(asset: TMediaAsset, width: number): string {
    return `${base(asset)}${asset.kind === "image" ? "w" : "poster-w"}${width}.webp`;
}

/** `srcset` listing every encoded width of the asset's still image. */
export function stillSrcSet(asset: TMediaAsset): string {
    return stillWidths(asset)
        .map((w) => `${stillFile(asset, w)} ${w}w`)
        .join(", ");
}

/** Single still URL: the smallest width >= `target`, else the largest. */
export function stillSrc(asset: TMediaAsset, target = 960): string {
    const widths = stillWidths(asset);
    if (widths.length === 0) return "";
    const pick = widths.find((w) => w >= target) ?? widths[widths.length - 1];
    return stillFile(asset, pick);
}

/** Video URL for a rendition, falling back to the closest one encoded. */
export function videoSrc(asset: TMediaAsset, rendition: 1080 | 720): string {
    const renditions = asset.variants.videos ?? [];
    if (renditions.length === 0) return "";
    const pick = renditions.includes(rendition) ? rendition : renditions[renditions.length - 1];
    return `${base(asset)}${pick}.mp4`;
}

export function isReady(asset: TMediaAsset | null | undefined): asset is TMediaAsset {
    return !!asset && asset.status === "ready";
}
