import type { TContactRequestType, TRequest } from "@/queries/type";
import { RequestStatusBadge } from "./RequestStatusBadge";

const TYPE_LABEL: Record<TContactRequestType, string> = {
    informacion: "Información",
    cita: "Cita",
    venta: "Venta",
    precalificacion: "Precalificación",
    proyecto: "Proyecto",
};

function formatDate(dateStr: string): string {
    if (!dateStr || dateStr === "0001-01-01T00:00:00Z") return "—";
    return new Date(dateStr).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function RequestRowCard({ request }: { request: TRequest }) {
    return (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-on-surface">{request.name}</p>
                <RequestStatusBadge status={request.status} className="flex-shrink-0" />
            </div>
            <p className="text-xs text-outline">
                {TYPE_LABEL[request.type]} · {request.phone}
            </p>
            <div className="flex items-center justify-between gap-2 pt-1 text-xs text-on-surface-variant">
                <span>Cita: {formatDate(request.scheduledDate)}</span>
                <span>Creado: {formatDate(request.date)}</span>
            </div>
        </div>
    );
}
