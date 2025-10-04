import type { TProperty } from "@/queries/type";
import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel";
import type { PropsWithChildren } from "react";

export function PropertyImageCarousel({ property }: { property: TProperty }) {
    return (
        <Carousel className="w-full h-full [&>*]:w-full [&>*]:h-full">
            <CarouselContent className="w-full h-full ml-0">
                {property.imgs.map((img) => (
                    <PropertyImageCarouselItem key={img}>
                        <img
                            src={"/static/properties/" + property.id + "/" + img}
                            alt={`Foto de la propiedad ${property.address}, ${property.nbHood}. C.P. ${property.zip}. ${property.city}, ${property.state}`}
                            className="pl-0 w-full max-h-full object-cover object-center"
                        />
                    </PropertyImageCarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
}

export function PropertyImageCarouselItem({ children }: {} & PropsWithChildren) {
    return <CarouselItem className="grow shrink-0 basis-full h-full pl-0">{children}</CarouselItem>;
}
