import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader } from "../ui/card";
import type { TProperty } from "@/queries/type";
import { Button } from "../ui/button";
import { BedIcon, Edit2, ToiletIcon, TrashIcon } from "lucide-react";
import { FormatMoney } from "@/lib/format";
import { SqMtIcon } from "../icons/icons";

export function PropertyCard({ propData }: { propData: TProperty }) {
    return (
        <Card className="py-0">
            <CardHeader className="p-0 bg-gray-100 gap-0">
                <Link to={`/panel/propiedades/${propData.id}`}>
                    <img src="/hero.png" alt="" className="w-full aspect-[4/2] object-cover object-center brightness-80 rounded-t-lg" />
                </Link>
            </CardHeader>
            <CardContent className="pt-0 pb-6 px-3 sm:px-3.5 space-y-3">
                <div className="grid grid-cols-[1fr_auto] auto-rows-min items-start gap-3">
                    <div>
                        <Link to={`/panel/propiedades/${propData.id}`} className="mt-auto space-y-2">
                            <h3 className="text-xl font-bold line-clamp-2">
                                {propData.address}, {propData.nbHood}. C.P. {propData.zip}
                            </h3>
                            <p className="text-lg font-medium text-current/80">
                                {FormatMoney(propData.price)}
                            </p>
                            <ul className="flex items-center gap-3 text-xs font-semibold text-current/60">
                                <li className="flex items-center gap-1.5">
                                    <SqMtIcon className="size-3" />
                                    <span>
                                        {
                                            propData.sqMt.toLocaleString("es-MX", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 4,
                                            })
                                        }
                                        m<sup>2</sup>
                                    </span>
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <BedIcon className="size-4" />
                                    <span>Req: {propData.beds}</span>
                                </li>
                                <li className="flex items-center gap-1.5">
                                    <ToiletIcon className="size-4" />
                                    <span>Baños: {propData.beds}</span>
                                </li>
                            </ul>
                        </Link>
                    </div>
                    <div className="flex flex-col space-y-2.5">
                        <Button className="flex items-center justify-center gap-3 text-sm" variant="secondary" size="sm" asChild>
                            <Link to={`/panel/propiedades/${propData.id}`}>
                                <Edit2 className="size-3" />
                                Editar
                            </Link>
                        </Button>
                        <Button className="flex items-center justify-center gap-3 text-sm" variant="destructive" size="sm">
                            <TrashIcon className="size-3" />
                            Eliminar
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
