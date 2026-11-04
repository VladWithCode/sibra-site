import type { ImgHTMLAttributes } from "react";
import { stillSrc, stillSrcSet, type TMediaAsset } from "@/lib/media";

export type TResponsiveImageProps = Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    "src" | "srcSet"
> & {
    asset: TMediaAsset;
    /** `sizes` attribute; describe the rendered width so the browser picks a small file. */
    sizes: string;
    alt: string;
    /** Above-the-fold LCP image: load eagerly with high priority. */
    priority?: boolean;
};

/**
 * Still image of a media asset (an image, or a video's poster) with every
 * encoded width in `srcset`. Lazy by default.
 */
export function ResponsiveImage({
    asset,
    sizes,
    alt,
    priority,
    ...props
}: TResponsiveImageProps) {
    return (
        <img
            src={stillSrc(asset)}
            srcSet={stillSrcSet(asset)}
            sizes={sizes}
            alt={alt}
            width={asset.width || undefined}
            height={asset.height || undefined}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            {...props}
        />
    );
}
