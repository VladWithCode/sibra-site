import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ShareIcon, SqMtIcon } from "../icons/icons";
import { FormatMoney } from "@/lib/format";
import { Button } from "../ui/button";
import { Heart, Image, Map } from "lucide-react";
import { PropertyLocationMap } from "@/maps/component";
import { useState } from "react";
import type { TProperty } from "@/queries/type";
import { Link } from "@tanstack/react-router";

export type TPropertyCardProps = {
    propData: TProperty;
    withMap?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export function PropertyCard({ propData: property, withMap }: TPropertyCardProps) {
    if (withMap === undefined) withMap = !!property.lat && !!property.lon;

    return (
        <Card className="pt-0 gap-4">
            {
                withMap ?
                    <PropertyCardHeaderWithMap property={property} /> :
                    <PropertyCardHeader property={property} />
            }
            <CardContent className="pt-0 px-4 sm:px-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-2xl text-current/80 font-[sans] font-bold">
                        <Link to={`/propiedades/${property.contract}/${property.slug}`}>
                            {FormatMoney(property.price)}
                        </Link>
                    </CardTitle>
                    <div className="flex items-center gap-1.5">
                        <Button variant="secondary" size="icon">
                            <ShareIcon className="size-5" />
                        </Button>
                        <Button variant="secondary" size="icon">
                            <Heart />
                        </Button>
                    </div>
                </div>
                <CardDescription>
                    <Link to={`/propiedades/${property.contract}/${property.slug}`} className="space-y-0.5">
                        <div className="flex items-center gap-3 text-current/60 font-semibold tracking-wide">
                            <div className="flex items-center gap-1 text-sm sm:text-base">
                                <span>{property.propertyType}</span>
                            </div>
                            <div className="flex items-end gap-1.5 text-xs sm:text-sm">
                                <SqMtIcon className="size-4" />
                                <span className="font-serif">{property.sqMt.toFixed(2)}mt<sup>2</sup></span>
                            </div>
                        </div>
                        <p className="line-clamp-2 font-medium">
                            {property.address}, {property.nbHood}. C.P. {property.zip}
                        </p>
                    </Link>
                </CardDescription>
            </CardContent>
        </Card >
    );
}

export function PropertyCardHeader({ property }: { property: TProperty }) {
    return (
        <CardHeader className="p-0">
            <div className="relative z-0">
                <div className="relative z-10 w-full aspect-[2/1] bg-gray-200 rounded-t-lg">
                    <img
                        src={property.mainImg ?
                            `/static/properties/${property.id}/${property.mainImg}` :
                            undefined}
                        alt={`Imagen mostrando la propiedad ubicada en ${property.address}, ${property.nbHood}. C.P. ${property.zip}`}
                        className="w-full h-full object-cover rounded-t-lg"
                    />
                </div>
            </div>
        </CardHeader>
    );
}

export function PropertyCardHeaderWithMap({ property }: { property: TProperty }) {
    const [activeTab, setActiveTab] = useState<"map" | "img">("img");
    const toggleActiveTab = () => {
        setActiveTab((activeTab) => (activeTab === "map" ? "img" : "map"));
    }

    return (
        <CardHeader className="p-0">
            <div className="relative z-0 w-full h-full overflow-hidden">
                <div className="absolute z-20 bottom-1.5 right-1.5">
                    <Button className="grid" onClick={toggleActiveTab} size="icon">
                        <Map className="col-start-1 row-start-1 size-4 opacity-100 transition-[height,_width,_opacity] data-[show=false]:size-0 data-[show=false]:opacity-0" data-show={activeTab === "img"} />
                        <Image className="col-start-1 row-start-1 size-0 opacity-0 transition-[height,_width,_opacity] data-[show=true]:size-4 data-[show=true]:opacity-100" data-show={activeTab === "map"} />
                    </Button>
                </div>
                <div className="relative z-10 w-full aspect-[2/1] bg-gray-200 transition-(--transition-appear) duration-500 translate-x-0 opacity-100 data-[is-active=false]:-translate-x-12 data-[is-active=false]:opacity-0 data-[is-active=false]:z-0" data-is-active={activeTab === "img"}>
                    <img
                        src={property.mainImg ?
                            `/static/properties/${property.id}/${property.mainImg}` :
                            undefined}
                        alt={`Imagen mostrando la propiedad ubicada en ${property.address}, ${property.nbHood}. C.P. ${property.zip}`}
                        className="w-full h-full object-cover rounded-t-lg"
                    />
                </div>
                <div className="absolute inset-0 z-0 rounded-t-lg overflow-hidden transition-(--transition-appear) duration-500 translate-x-12 opacity-0 data-[is-active=true]:translate-x-0 data-[is-active=true]:opacity-100 data-[is-active=true]:z-10" data-is-active={activeTab === "map"}>
                    <PropertyLocationMap property={property} />
                </div>
            </div>
        </CardHeader>
    );
}
