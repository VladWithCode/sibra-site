import { cn } from "@/lib/utils";
import type { TQuoteStatus } from "@/queries/type";

const STATUS_LABELS: Record<TQuoteStatus, string> = {
    pendiente: "Pendiente",
    atendida: "Atendida",
    confirmada: "Confirmada",
    "volver a atender": "Volver a atender",
};

const STATUS_TONES: Record<TQuoteStatus, string> = {
    pendiente: "bg-amber-50 text-amber-700 border-amber-100",
    atendida: "bg-emerald-50 text-emerald-700 border-emerald-100",
    confirmada: "bg-blue-50 text-blue-700 border-blue-100",
    "volver a atender": "bg-rose-50 text-rose-700 border-rose-100",
};

export function RequestStatusBadge({ status, className }: { status: TQuoteStatus; className?: string }) {
    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-tiny font-bold uppercase tracking-wide border",
                STATUS_TONES[status],
                className,
            )}
        >
            {STATUS_LABELS[status]}
        </span>
    );
}

export const REQUEST_STATUS_OPTIONS: { value: TQuoteStatus; label: string }[] = (
    Object.keys(STATUS_LABELS) as TQuoteStatus[]
).map((value) => ({ value, label: STATUS_LABELS[value] }));
