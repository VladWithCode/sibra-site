import type { TContactRequestType, TQuote } from "@/queries/type";
import { setDoneQuoteOpts, updateQuoteOpts } from "@/queries/quotes";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CircleCheck, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RequestDeleteDialog } from "./RequestDeleteDialog";

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
    const [deleteOpen, setDeleteOpen] = useState(false);
    const markDoneMut = useMutation(setDoneQuoteOpts(request.id));

    return (
        <tr className="group hover:bg-surface-bright transition-colors duration-300">
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
            <td className="px-6 py-5 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    <button
                        type="button"
                        disabled={request.status === "atendida" || markDoneMut.isPending}
                        onClick={() =>
                            markDoneMut.mutate(
                                { id: request.id, quote: { status: "atendida" } },
                                {
                                    onSuccess: () =>
                                        toast.success("Solicitud marcada como atendida", { closeButton: true }),
                                    onError: (e: any) =>
                                        toast.error(e?.message || "Error al actualizar", { closeButton: true }),
                                },
                            )
                        }
                        aria-label="Marcar como atendida"
                        className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-600/5 rounded-lg transition-all disabled:opacity-30 disabled:pointer-events-none"
                    >
                        <CircleCheck className="size-4" />
                    </button>
                    <Link
                        to="/panel/citas/$id"
                        params={{ id: request.id }}
                        aria-label="Editar solicitud"
                        className="p-2 text-slate-400 hover:text-sbr-blue hover:bg-sbr-blue/5 rounded-lg transition-all"
                    >
                        <Edit2 className="size-4" />
                    </Link>
                    <button
                        type="button"
                        onClick={() => setDeleteOpen(true)}
                        aria-label="Eliminar solicitud"
                        className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all"
                    >
                        <Trash2 className="size-4" />
                    </button>
                </div>
                <RequestDeleteDialog
                    requestId={request.id}
                    requestLabel={request.name}
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                />
            </td>
        </tr>
    );
}
