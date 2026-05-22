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

export function PropertyRow({ property }: { property: TProperty }) {
    const navigate = useNavigate();
    const [deleteOpen, setDeleteOpen] = useState(false);

    const detailHref = { to: "/panel/propiedades/$id", params: { id: property.id } } as const;
    const imgSrc = property.mainImg ? `/static/properties/${property.id}/${property.mainImg}` : undefined;

    const INTERACTIVE = "a, button, [role='button']";
    const onRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
        if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
        navigate(detailHref);
    };
    const onRowKey = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
        if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
        if (e.key === "Enter") {
            e.preventDefault();
            navigate(detailHref);
        }
    };

    return (
        <tr
            className="group cursor-pointer hover:bg-surface-bright transition-colors duration-300"
            onClick={onRowClick}
            onKeyDown={onRowKey}
            tabIndex={0}
            role="link"
            aria-label={`Ver detalle de ${property.address}`}
        >
            <td className="px-6 py-5">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                        {imgSrc ? (
                            <img
                                src={imgSrc}
                                alt={property.address}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <ImgPlaceholder className="w-full h-full" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <Link
                            {...detailHref}
                            className="text-sm font-bold text-on-surface line-clamp-1 hover:text-sbr-blue"
                        >
                            {property.address || "Sin dirección"}
                        </Link>
                        <p className="text-xs text-outline">
                            {TYPE_LABEL[property.propertyType]} • {property.sqMt.toLocaleString("es-MX")} m²
                        </p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <p className="text-sm text-on-surface-variant line-clamp-1">
                    {property.city}
                    {property.state ? `, ${property.state}` : ""}
                </p>
                {property.nbHood ? (
                    <p className="text-[11px] text-outline line-clamp-1">{property.nbHood}</p>
                ) : null}
            </td>
            <td className="px-6 py-5">
                <p className="text-sm font-bold text-sbr-blue">{FormatMoney(property.price)}</p>
                <p className="text-[11px] text-outline">{CONTRACT_LABEL[property.contract]}</p>
            </td>
            <td className="px-6 py-5">
                <PropertyStatusBadge status={property.status} />
            </td>
            <td className="px-6 py-5 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
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
                <PropertyDeleteDialog
                    propertyId={property.id}
                    propertyLabel={property.address}
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                />
            </td>
        </tr>
    );
}
