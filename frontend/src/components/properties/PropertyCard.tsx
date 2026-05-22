import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { ShareIcon, SqMtIcon } from "../icons/icons";
import { FormatMetric, FormatMoney } from "@/lib/format";
import { Button } from "../ui/button";
import { Bath, Bed, Image, Map, MapPin } from "lucide-react";
import { PropertyLocationMap } from "@/maps/component";
import { useId, useState } from "react";
import type { TProperty } from "@/queries/type";
import { Link } from "@tanstack/react-router";
import { LikeButton } from "./likeButton";
import { motion } from "motion/react";
import { PropertyImage } from "../Image";
import { getPropertyAddress } from "@/lib/utils";
import { Badge } from "../ui/badge";

export type TPropertyCardProps = {
    propData: TProperty;
    withMap?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

export function PropertyCard({ propData: property, withMap }: TPropertyCardProps) {
    if (withMap === undefined) withMap = !!property.lat && !!property.lon;

    return (
        <Card className="pt-0 gap-4">
            {withMap ? (
                <PropertyCardHeaderWithMap property={property} />
            ) : (
                <PropertyCardHeader property={property} />
            )}
            <CardContent className="pt-0 px-4 sm:px-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-2xl lg:text-3xl text-current/80 font-bold">
                        <Link to={`/propiedades/${property.contract}/${property.slug}`}>
                            {FormatMoney(property.price)}
                        </Link>
                    </CardTitle>
                    <div className="flex items-center gap-1.5">
                        <Button variant="secondary" size="icon">
                            <ShareIcon className="size-5" />
                        </Button>
                        <LikeButton propData={property} />
                    </div>
                </div>
                <CardDescription>
                    <Link
                        to={`/propiedades/${property.contract}/${property.slug}`}
                        className="space-y-0.5"
                    >
                        <div className="flex items-center gap-3 text-current/60 font-semibold tracking-wide">
                            <div className="flex items-center gap-1 text-sm sm:text-base capitalize">
                                <span>{property.propertyType}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                                <SqMtIcon className="size-4" />
                                <span className="">
                                    {property.sqMt.toFixed(2)}mt<sup>2</sup>
                                </span>
                            </div>
                        </div>
                        <p className="line-clamp-1 font-medium">
                            {property.address}. C.P. {property.zip}
                        </p>
                    </Link>
                </CardDescription>
            </CardContent>
        </Card>
    );
}

export function PropertyCardHeader({ property }: { property: TProperty }) {
    return (
        <CardHeader className="p-0">
            <div className="relative z-0 w-full h-full overflow-hidden">
                <Link to={`/propiedades/${property.contract}/${property.slug}`} className="relative z-10 w-full aspect-[2/1] bg-gray-200 rounded-t-lg">
                    <img
                        src={
                            property.mainImg
                                ? `/static/properties/${property.id}/${property.mainImg}`
                                : undefined
                        }
                            alt={`Imagen mostrando la propiedad ubicada en ${property.address}. C.P. ${property.zip}`}
                        className="w-full h-full object-cover rounded-t-lg"
                    />
                </Link>
            </div>
        </CardHeader>
    );
}

export function PropertyCardHeaderWithMap({ property }: { property: TProperty }) {
    const [activeTab, setActiveTab] = useState<"map" | "img">("img");
    const toggleActiveTab = () => {
        setActiveTab((activeTab) => (activeTab === "map" ? "img" : "map"));
    };

    return (
        <CardHeader className="p-0">
            <div className="relative z-0 w-full h-full overflow-hidden">
                <div className="absolute z-20 bottom-1.5 right-1.5">
                    <Button className="grid" onClick={toggleActiveTab} size="icon">
                        <Map
                            className="col-start-1 row-start-1 size-4 opacity-100 transition-[height,_width,_opacity] data-[show=false]:size-0 data-[show=false]:opacity-0"
                            data-show={activeTab === "img"}
                        />
                        <Image
                            className="col-start-1 row-start-1 size-0 opacity-0 transition-[height,_width,_opacity] data-[show=true]:size-4 data-[show=true]:opacity-100"
                            data-show={activeTab === "map"}
                        />
                    </Button>
                </div>
                <div
                    className="relative z-10 w-full aspect-[2/1] bg-gray-200 transition-(--transition-appear) duration-500 translate-x-0 opacity-100 data-[is-active=false]:-translate-x-12 data-[is-active=false]:opacity-0 data-[is-active=false]:z-0"
                    data-is-active={activeTab === "img"}
                >
                    <Link to={`/propiedades/${property.contract}/${property.slug}`}>
                        <img
                            src={
                                property.mainImg
                                    ? `/static/properties/${property.id}/${property.mainImg}`
                                    : undefined
                            }
                        alt={`Imagen mostrando la propiedad ubicada en ${property.address}. C.P. ${property.zip}`}
                            className="w-full h-full object-cover rounded-t-lg"
                        />
                    </Link>
                </div>
                <div
                    className="absolute inset-0 z-0 rounded-t-lg overflow-hidden transition-(--transition-appear) duration-500 translate-x-12 opacity-0 data-[is-active=true]:translate-x-0 data-[is-active=true]:opacity-100 data-[is-active=true]:z-10"
                    data-is-active={activeTab === "map"}
                >
                    <PropertyLocationMap property={property} />
                </div>
            </div>
        </CardHeader>
    );
}

export function NewPropertyCard({ property, disableMap }: {
    property: TProperty;
    disableMap?: boolean;
}) {
    const hasLocation = property.lat && property.lon;

    return (
        <motion.article
            key={property.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="h-full group flex flex-col"
        >
            <div className="relative aspect-[4/3] grid grid-cols-2 grid-rows-2 gap-3 overflow-hidden rounded-2xl mb-4 bg-surface-container-low shadow-sm">
                <Link to={"/propiedades/" + property.contract + "/" + property.slug} className="col-span-full row-span-full">
                    <PropertyImage
                        propId={property.id}
                        propName={property.address}
                        src={property.mainImg}
                    />
                </Link>
                <div className="col-start-1 row-start-1 p-3">
                    <div className="flex flex-wrap items-start gap-2 capitalize">
                        <Badge>{property.contract}</Badge>
                        <Badge className="h-auto bg-sbr-blue text-on-primary" variant="ghost">{property.propertyType}</Badge>
                        <Badge variant="secondary">Oferta</Badge>
                    </div>
                </div>
                <div className="col-start-2 row-start-1 pt-3 pr-3 min-w-0 justify-self-stretch self-start flex">
                    <div className="w-max max-w-full flex items-center gap-1.5 text-on-surface-variant/80 text-sm break-words glass px-3 py-1.5 ml-auto rounded-lg font-medium tracking-tight">
                        <MapPin className="shrink-0 w-4.5 h-4.5 text-sbr-blue-light -mt-px" />
                        <span className="text-balance">{property.state}, {property.city}</span>
                    </div>
                </div>
                {
                    !disableMap && hasLocation ? (
                        <NewPropertyCardMap lat={property.lat} lon={property.lon} />
                    ) : null
                }
            </div>
            <div className="flex-1 px-2 xl:p-0 flex flex-col justify-between">
                <div className="flex justify-between items-center mb-5">
                    <Link to={"/propiedades/" + property.contract + "/" + property.slug} className="flex flex-col gap-1">
                        <h3 className="font-headline text font-medium text-on-surface/80 tracking-tight">
                            {getPropertyAddress(property, { includeCity: false, includeState: false })}
                        </h3>
                        <p className="text-3xl font-bold">{FormatMoney(property.price)}</p>
                    </Link>
                    <LikeButton propData={property} />
                </div>
                <div className="border-t border-outline-variant/30">
                    <div className="w-fit min-w-xs grid grid-cols-3 gap-4 xl:gap-2 text-on-surface-variant py-3 mx-auto">
                        <div className="space-y-1 placese">
                            <span className="text-tiny uppercase tracking-widest text-current/80">Beds</span>
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{property.beds}</span>
                                <Bed className="size-5" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-tiny uppercase tracking-widest text-current/80">Baths</span>
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{property.baths}</span>
                                <Bath className="size-5" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-tiny uppercase tracking-widest text-current/80">Area</span>
                            <div className="flex items-baseline">
                                <span className="font-bold text-lg">{FormatMetric(property.sqMt)}<sup>2</sup></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.article>
    );
}

function NewPropertyCardMap({ lat, lon }: { lat: number, lon: number }) {
    const [isMapActive, setIsMapActive] = useState(false);
    const id = useId()

    return (
        <>
            <div className="relative z-20 col-start-2 row-start-2 self-end justify-self-end p-3" key={id + "-map-toggle"}>
                <Button
                    className="grid size-auto p-2 glass"
                    onClick={() => setIsMapActive(state => !state)}
                    variant="ghost"
                    size="icon"
                >
                    <Map
                        className="col-start-1 row-start-1 size-6 opacity-100 transition-[height,_width,_opacity] data-[active=true]:size-0 data-[active=true]:opacity-0"
                        data-active={isMapActive}
                    />
                    <Image
                        className="col-start-1 row-start-1 size-0 opacity-0 transition-[height,_width,_opacity] data-[active=false]:size-6 data-[active=false]:opacity-100"
                        data-active={!isMapActive}
                    />
                </Button>
            </div>
            <div
                className="col-span-full row-span-full rounded-lg opacity-0 scale-85 pointer-events-none duration-300 transition-[opacity,transform,scale] data-[active=true]:opacity-100 data-[active=true]:scale-100 data-[active=true]:pointer-events-auto"
                data-active={isMapActive}
            >
                <PropertyLocationMap property={{ lat: lat, lon: lon } as TProperty} />
            </div>
        </>
    );
}
