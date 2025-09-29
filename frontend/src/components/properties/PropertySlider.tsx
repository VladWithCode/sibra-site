import { useCallback, useEffect, useState, type PropsWithChildren } from "react"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "../ui/carousel"
import type { TProperty } from "@/queries/type"
import { PropertyCard } from "./PropertyCard"

export function PropertyCarousel({ properties }: { properties: TProperty[] }) {
    const [currentProperty, setCurrentProperty] = useState(0)
    const [api, setApi] = useState<CarouselApi>()
    const selectSlideCb = useCallback((api: CarouselApi) => {
        if (!api) return
        setCurrentProperty(api.selectedScrollSnap())
    }, [])

    useEffect(() => {
        setCurrentProperty(0)

        return () => {
            setCurrentProperty(0)
        }
    }, [])

    useEffect(() => {
        if (!api) return

        api.on("select", selectSlideCb)
    }, [api])

    return (
        <Carousel className="space-y-3" setApi={setApi}>
            <CarouselContent>
                {properties.map((property) => (
                    <PropertyCarouselItem key={property.id}>
                        <PropertyCard propData={{ ...property, lat: 24.0083833, lon: -104.6713768 }} withMap={true} />
                    </PropertyCarouselItem>
                ))}
            </CarouselContent>
            {/* <CarouselPrevious className="-left-5 bg-sbr-blue text-white" />
            <CarouselNext className="-right-5 bg-sbr-blue text-white" /> */}
            <div className="flex items-center justify-center gap-1.5">
                {properties.map((property, idx) => (
                    <div
                        key={`dot-${property.id}`}
                        className="rounded-full size-2 bg-gray-400 data-[state=active]:bg-sbr-blue data-[state=inactive]:bg-gray-400 transition-colors"
                        data-state={idx === currentProperty ? "active" : "inactive"}
                    ></div>
                ))}
            </div>
        </Carousel>
    );
}

export function PropertyCarouselItem({ children }: {} & PropsWithChildren) {
    return (
        <CarouselItem className="not-first:pl-6 grow-0 shrink-0 basis-6/7 xs:basis-3/4 max-w-96 aspect-[2/1]">
            {children}
        </CarouselItem>
    );
}
