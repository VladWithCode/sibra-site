import type { TContactRequestType, TQuote } from "@/queries/type";
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

export function RequestRow({ request }: { request: TQuote }) {
    return (
        <tr className="hover:bg-surface-bright transition-colors duration-300">
            <td className="px-6 py-5">
                <p className="text-sm font-bold text-on-surface">{request.name}</p>
            </td>
            <td className="px-6 py-5">
                <p className="text-sm text-on-surface-variant">{request.phone}</p>
            </td>
            <td className="px-6 py-5">
                <p className="text-sm text-on-surface-variant">
                    {TYPE_LABEL[request.type]}
                </p>
            </td>
            <td className="px-6 py-5">
                <RequestStatusBadge status={request.status} />
            </td>
            <td className="px-6 py-5">
                <p className="text-sm text-on-surface-variant">
                    {formatDate(request.scheduledDate)}
                </p>
            </td>
            <td className="px-6 py-5">
                <p className="text-sm text-on-surface-variant">
                    {formatDate(request.date)}
                </p>
            </td>
        </tr>
    );
}
