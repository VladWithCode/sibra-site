import type { TProperty } from "@/queries/type";
import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel";
import type { PropsWithChildren } from "react";

export function PropertyImageCarousel({ property }: { property: TProperty }) {
    return (
        <Carousel>
            <CarouselContent className="aspect-[3/2]">
                {property.imgs.map(img => (
                    <PropertyImageCarouselItem key={img}>
                        <img
                            src={"/static/properties/" + property.id + "/" + img}
                            alt={`Foto de la propiedad ${property.address}, ${property.nbHood}. C.P. ${property.zip}. ${property.city}, ${property.state}`}
                            className="w-full h-full object-cover object-center"
                        />
                    </PropertyImageCarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
}

export function PropertyImageCarouselItem({ children }: {} & PropsWithChildren) {
    return (
        <CarouselItem className="grow shrink-0 basis-full h-full">
            {children}
        </CarouselItem>
    );
}
