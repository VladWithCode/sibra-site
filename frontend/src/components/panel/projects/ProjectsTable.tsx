import type { TProject } from "@/queries/type";
import { ProjectRow } from "./ProjectRow";
import { ProjectRowCard } from "./ProjectRowCard";

export function ProjectsTable({
    projects,
    isLoading,
}: {
    projects: TProject[];
    isLoading?: boolean;
}) {
    if (isLoading) {
        return <ProjectsTableSkeleton />;
    }

    if (projects.length === 0) {
        return (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-10 text-center">
                <p className="text-sm font-semibold text-on-surface">Sin proyectos</p>
                <p className="text-xs text-outline mt-1">
                    Ajusta la busqueda o agrega un nuevo proyecto para verlo aqui.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            {/* Card list: tablet / smaller laptop */}
            <div className="lg:hidden flex flex-col gap-3 p-3 sm:p-4">
                {projects.map((p) => (
                    <ProjectRowCard key={p.id} project={p} />
                ))}
            </div>

            {/* Table: laptop / desktop */}
            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-surface-container-low text-left">
                            <th className="px-6 py-4 text-[10px] tracking-wider uppercase text-outline font-bold">
                                Proyecto
                            </th>
                            <th className="px-6 py-4 text-[10px] tracking-wider uppercase text-outline font-bold">
                                Ubicacion
                            </th>
                            <th className="px-6 py-4 text-[10px] tracking-wider uppercase text-outline font-bold">
                                Area total
                            </th>
                            <th className="px-6 py-4 text-[10px] tracking-wider uppercase text-outline font-bold">
                                Lotes
                            </th>
                            <th className="px-6 py-4 text-[10px] tracking-wider uppercase text-outline font-bold text-right">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                        {projects.map((p) => (
                            <ProjectRow key={p.id} project={p} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ProjectsTableSkeleton() {
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
