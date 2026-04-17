import { cn } from "@/lib/utils";
import type { TPropertyStatus } from "@/queries/type";

const STATUS_LABELS: Record<TPropertyStatus, string> = {
    publicada: "Publicada",
    en_revision: "En revisión",
    vendida: "Vendida",
    borrador: "Borrador",
    archivada: "Archivada",
    no_disponible: "No disponible",
};

const STATUS_TONES: Record<TPropertyStatus, string> = {
    publicada: "bg-blue-50 text-blue-700 border-blue-100",
    en_revision: "bg-amber-50 text-amber-700 border-amber-100",
    vendida: "bg-emerald-50 text-emerald-700 border-emerald-100",
    borrador: "bg-slate-100 text-slate-600 border-slate-200",
    archivada: "bg-surface-container-high text-on-surface-variant border-outline-variant/40",
    no_disponible: "bg-rose-50 text-rose-700 border-rose-100",
};

export function PropertyStatusBadge({ status, className }: { status: TPropertyStatus; className?: string }) {
    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                STATUS_TONES[status],
                className,
            )}
        >
            {STATUS_LABELS[status]}
        </span>
    );
}

export const PROPERTY_STATUS_OPTIONS: { value: TPropertyStatus; label: string }[] = (
    Object.keys(STATUS_LABELS) as TPropertyStatus[]
).map((value) => ({ value, label: STATUS_LABELS[value] }));
