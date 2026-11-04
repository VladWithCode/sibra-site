import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { isReady } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { TProperty } from "@/queries/type";

export function Image({ src, alt, ...props }: { src: string, alt?: string } & React.ImgHTMLAttributes<HTMLImageElement>) {
    const fullSrc = "/static" + src;
    const safeAlt = alt !== "" ? alt : "Imagen";

    return (
        <img
            src={fullSrc}
            alt={safeAlt}
            {...props}
        />
    );
}

/** Main image of a property with responsive widths, or a neutral placeholder. */
export function PropertyMainImage({ property, sizes, priority, className }: {
    property: Pick<TProperty, "mainImage" | "address">,
    sizes: string,
    priority?: boolean,
    className?: string,
}) {
    if (!isReady(property.mainImage)) {
        return <div className={cn("bg-surface-container-highest", className)} aria-hidden />;
    }
    return (
        <ResponsiveImage
            asset={property.mainImage}
            sizes={sizes}
            priority={priority}
            alt={`Foto de la propiedad ${property.address}`}
            className={className}
        />
    );
}

export function ProjectImage({ projName, src, ...props }: {
    projName: string,
    src: string,
} & React.ImgHTMLAttributes<HTMLImageElement>) {
    return <Image src={`/uploads/${src}`} alt={`Foto del proyecto ${projName}`} {...props} />
}
