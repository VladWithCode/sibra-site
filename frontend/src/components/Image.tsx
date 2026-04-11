export function Image({ src, alt, ...props }: { src: string, alt: string } & React.ImgHTMLAttributes<HTMLImageElement>) {
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

export function PropertyImage({ propId, propName, src, ...props }: {
    propId: string,
    propName: string,
    src: string,
} & React.ImgHTMLAttributes<HTMLImageElement>) {
    return <Image src={`/properties/${propId}/${src}`} alt={`Foto de la propiedad ${propName}`} {...props} />
}
