import { FormatMoney } from "@/lib/format";
import type { TProperty } from "@/queries/type";
import { Link, useNavigate } from "@tanstack/react-router";
import { Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { PropertyStatusBadge } from "./PropertyStatusBadge";
import { PropertyDeleteDialog } from "./PropertyDeleteDialog";
import { ImgPlaceholder } from "@/components/ui/img-placeholder";

const TYPE_LABEL: Record<TProperty["propertyType"], string> = {
    casa: "Casa",
    apartamento: "Apartamento",
    terreno: "Terreno",
};

const CONTRACT_LABEL: Record<TProperty["contract"], string> = {
    venta: "Venta",
    renta: "Renta",
};

export function PropertyRowCard({ property }: { property: TProperty }) {
    const navigate = useNavigate();
    const [deleteOpen, setDeleteOpen] = useState(false);

    const detailHref = { to: "/panel/propiedades/$id", params: { id: property.id } } as const;
    const imgSrc = property.mainImg ? `/static/properties/${property.id}/${property.mainImg}` : undefined;

    const INTERACTIVE = "a, button, [role='button']";
    const onCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
        navigate(detailHref);
    };
    const onCardKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
        if (e.key === "Enter") {
            e.preventDefault();
            navigate(detailHref);
        }
    };

    return (
        <div
            role="link"
            tabIndex={0}
            aria-label={`Ver detalle de ${property.address}`}
            onClick={onCardClick}
            onKeyDown={onCardKey}
            className="group cursor-pointer bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 flex gap-4 hover:shadow-md hover:border-sbr-blue/30 transition-all"
        >
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={property.address}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <ImgPlaceholder className="w-full h-full" />
                )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                    <Link
                        {...detailHref}
                        className="text-sm font-bold text-on-surface line-clamp-1 hover:text-sbr-blue"
                    >
                        {property.address || "Sin dirección"}
                    </Link>
                    <PropertyStatusBadge status={property.status} className="flex-shrink-0" />
                </div>
                <p className="text-xs text-outline">
                    {TYPE_LABEL[property.propertyType]} • {property.sqMt.toLocaleString("es-MX")} m² • {CONTRACT_LABEL[property.contract]}
                </p>
                <p className="text-sm text-on-surface-variant line-clamp-1">
                    {property.city}
                    {property.state ? `, ${property.state}` : ""}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <p className="text-base font-bold text-sbr-blue">{FormatMoney(property.price)}</p>
                    <div className="flex items-center gap-1">
                        <Link
                            {...detailHref}
                            aria-label="Editar propiedad"
                            className="p-2 text-slate-400 hover:text-sbr-blue hover:bg-sbr-blue/5 rounded-lg transition-all"
                        >
                            <Edit2 className="size-4" />
                        </Link>
                        <button
                            type="button"
                            onClick={() => setDeleteOpen(true)}
                            aria-label="Eliminar propiedad"
                            className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    </div>
                </div>
            </div>
            <PropertyDeleteDialog
                propertyId={property.id}
                propertyLabel={property.address}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
            />
        </div>
    );
}
