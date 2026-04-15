import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";
import type { TPropertyCardProps } from "./PropertyCard";
import { Bath, Bed, MapPin } from "lucide-react";
import { FormatMetric, FormatMoney } from "@/lib/format";
import { Badge } from "../ui/badge";
import { Link } from "@tanstack/react-router";

export function HomePropertyCard({ propData, className }: TPropertyCardProps) {
    return (
        <Link to={"/propiedades/" + propData.contract + "/" + propData.id}>
            <Card className={cn("h-full p-0 rounded-lg overflow-hidden", className)}>
                <CardContent className="relative w-full h-full z-0 p-0">
                    <div className="absolute inset-0 z-0">
                        <img
                            src={propData.mainImg ? `/static/properties/${propData.id}/${propData.mainImg}` : undefined}
                            alt="Imagen mostrando la propiedad ubicada en 123 rue de la ville, 12345 C.P. 12345"
                            className="w-full h-full object-cover brightness-90"
                        />
                    </div>
                    <div className="absolute top-3 left-3">
                        <Badge className="uppercase rounded-lg font-semibold tracking-wide">{propData.contract}</Badge>
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-end bg-gradient-to-t from-foreground/60 to-60% to-foreground/0 text-background p-6">
                        <CardTitle className="text-3xl tracking-wide">{FormatMoney(propData.price)}</CardTitle>
                        <CardDescription className="text-current tracking-tight mt-1.5 space-y-6">
                            <div className="flex gap-2 items-center font-normal">
                                <MapPin className="size-3.5" />
                                <p className="line-clamp-1 font-medium">
                                    {propData.address}, {propData.nbHood}. C.P. {propData.zip}
                                </p>
                            </div>
                            <ul className="flex gap-4 items-center">
                                <li className="flex gap-1 items-center">
                                    <span className="font-extrabold">
                                        {FormatMetric(propData.sqMt)}<sup>2</sup>
                                    </span>
                                    {/* <SqMtIcon className="size-3.5" /> */}
                                </li>
                                {
                                    propData.baths > 0 &&
                                    <li className="flex gap-1 items-center">
                                        <span className="font-extrabold">
                                            {propData.baths}
                                        </span>
                                        <Bath className="size-3.5" />
                                    </li>
                                }
                                {
                                    propData.beds > 0 &&
                                    <li className="flex gap-1 items-center">
                                        <span className="font-extrabold">
                                            {propData.beds}
                                        </span>
                                        <Bed className="size-3.5" />
                                    </li>
                                }
                            </ul>
                        </CardDescription>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
