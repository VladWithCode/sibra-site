import type { TProjectAssociate } from '@/queries/type';
import { AssociateRow } from './AssociateRow';
import { AssociateRowCard } from './AssociateRowCard';

export function AssociatesTable({
    associates,
    projectId,
}: {
    associates: TProjectAssociate[];
    projectId: string;
}) {
    if (associates.length === 0) {
        return (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-10 text-center">
                <p className="text-sm font-semibold text-on-surface">
                    Sin asociados
                </p>
                <p className="text-xs text-outline mt-1">
                    Agrega asociados a este proyecto para verlos aqui.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Mobile cards */}
            <div className="lg:hidden flex flex-col gap-3 p-3 sm:p-4">
                {associates.map((a) => (
                    <AssociateRowCard
                        key={a.id}
                        associate={a}
                        projectId={projectId}
                    />
                ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-surface-container-low text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                            <th className="px-6 py-4">Nombre</th>
                            <th className="px-6 py-4">RFC / CURP</th>
                            <th className="px-6 py-4">Lote / Manzana</th>
                            <th className="px-6 py-4">Pago</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                        {associates.map((a) => (
                            <AssociateRow
                                key={a.id}
                                associate={a}
                                projectId={projectId}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
