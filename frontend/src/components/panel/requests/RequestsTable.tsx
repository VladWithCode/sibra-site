import type { TPagination, TQuote } from "@/queries/type";
import { RequestRow } from "./RequestRow";
import { RequestRowCard } from "./RequestRowCard";
import { RequestsPaginator } from "./RequestsPaginator";

export function RequestsTable({
    requests,
    pagination,
    isLoading,
}: {
    requests: TQuote[];
    pagination: TPagination;
    isLoading?: boolean;
}) {
    if (isLoading) {
        return <RequestsTableSkeleton />;
    }

    if (requests.length === 0) {
        return (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-10 text-center">
                <p className="text-sm font-semibold text-on-surface">Sin solicitudes</p>
                <p className="text-xs text-outline mt-1">
                    Ajusta los filtros o espera a que se registren nuevas solicitudes.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="lg:hidden flex flex-col gap-3 p-3 sm:p-4">
                {requests.map((r) => (
                    <RequestRowCard key={r.id} request={r} />
                ))}
            </div>

            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-surface-container-low text-left">
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">
                                Nombre
                            </th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">
                                Teléfono
                            </th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">
                                Tipo
                            </th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">
                                Estado
                            </th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">
                                Fecha de cita
                            </th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">
                                Fecha de creación
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                        {requests.map((r) => (
                            <RequestRow key={r.id} request={r} />
                        ))}
                    </tbody>
                </table>
            </div>

            <RequestsPaginator pagination={pagination} />
        </div>
    );
}

function RequestsTableSkeleton() {
    return (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
                <div
                    key={i}
                    className="h-16 rounded-lg bg-surface-container animate-pulse"
                />
            ))}
        </div>
    );
}
