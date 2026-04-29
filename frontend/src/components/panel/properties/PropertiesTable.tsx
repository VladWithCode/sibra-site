import type { TProperty, TPagination } from "@/queries/type";
import { PropertyRow } from "./PropertyRow";
import { PropertyRowCard } from "./PropertyRowCard";
import { PropertiesPaginator } from "./PropertiesPaginator";

export function PropertiesTable({
    properties,
    pagination,
    isLoading,
}: {
    properties: TProperty[];
    pagination: TPagination;
    isLoading?: boolean;
}) {
    if (isLoading) {
        return <PropertiesTableSkeleton />;
    }

    if (properties.length === 0) {
        return (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-10 text-center">
                <p className="text-sm font-semibold text-on-surface">Sin propiedades</p>
                <p className="text-xs text-outline mt-1">
                    Ajusta los filtros o agrega una nueva propiedad para verla aquí.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            {/* Card list: tablet / smaller laptop */}
            <div className="lg:hidden flex flex-col gap-3 p-3 sm:p-4">
                {properties.map((p) => (
                    <PropertyRowCard key={p.id} property={p} />
                ))}
            </div>

            {/* Table: laptop / desktop */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-surface-container-low text-left">
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">
                                Propiedad
                            </th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">
                                Ubicación
                            </th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">
                                Precio
                            </th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">
                                Estado
                            </th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold text-right">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                        {properties.map((p) => (
                            <PropertyRow key={p.id} property={p} />
                        ))}
                    </tbody>
                </table>
            </div>

            <PropertiesPaginator pagination={pagination} />
        </div>
    );
}

function PropertiesTableSkeleton() {
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
