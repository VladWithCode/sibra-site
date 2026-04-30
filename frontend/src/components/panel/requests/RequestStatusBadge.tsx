import { cn } from "@/lib/utils";
import type { TQuoteStatus } from "@/queries/type";

const STATUS_LABELS: Record<TQuoteStatus, string> = {
    pendiente: "Pendiente",
    atendida: "Atendida",
    confirmada: "Confirmada",
    "volver a atender": "Volver a atender",
};

const STATUS_TONES: Record<TQuoteStatus, string> = {
    pendiente: "bg-amber-100/50 text-amber-700 border-amber-500",
    atendida: "bg-emerald-100/50 text-emerald-700 border-emerald-500",
    confirmada: "bg-blue-100/50 text-blue-700 border-blue-500",
    "volver a atender": "bg-rose-100/50 text-rose-700 border-rose-500",
};

export function RequestStatusBadge({ status, className }: { status: TQuoteStatus; className?: string }) {
    return (
        <span
            className={cn(
                STATUS_TONES[status],
                "inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-wide border",
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
