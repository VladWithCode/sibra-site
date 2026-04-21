import { getProjectsOpts } from '@/queries/projects';
import type { TProject } from '@/queries/type';
import { useQuery } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import { ChevronRight, Users } from 'lucide-react';

export const Route = createFileRoute('/panel/asociados/')({
    component: RouteComponent,
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(getProjectsOpts);
    },
});

function RouteComponent() {
    const { data, isLoading } = useQuery(getProjectsOpts);
    const projects = data?.projects ?? [];

    return (
        <main className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8 lg:mb-10">
                <span className="block text-[10px] tracking-[0.15em] uppercase text-sbr-blue font-bold">
                    Administracion
                </span>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-on-surface mt-1 tracking-tight">
                    Asociados
                </h2>
                <p className="text-sm text-outline mt-2">
                    Selecciona un proyecto para ver y gestionar sus asociados.
                </p>
            </div>

            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-32 rounded-xl bg-surface-container animate-pulse"
                        />
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-xl shadow-sm p-10 text-center">
                    <p className="text-sm font-semibold text-on-surface">
                        Sin proyectos
                    </p>
                    <p className="text-xs text-outline mt-1">
                        Crea un proyecto primero para gestionar sus asociados.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            )}
        </main>
    );
}

function ProjectCard({ project }: { project: TProject }) {
    return (
        <Link
            to="/panel/proyectos/$id/asociados"
            params={{ id: project.id }}
            className="group bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-5 flex items-start gap-4 hover:shadow-md hover:border-sbr-blue/30 transition-all"
        >
            <div className="size-10 rounded-lg bg-sbr-blue/10 flex items-center justify-center flex-shrink-0">
                <Users className="size-5 text-sbr-blue" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-on-surface line-clamp-1 group-hover:text-sbr-blue transition-colors">
                    {project.name}
                </p>
                <p className="text-xs text-outline line-clamp-1 mt-0.5">
                    {project.location}
                </p>
                <p className="text-xs text-on-surface-variant mt-2">
                    {project.associates?.length ?? 0} asociados
                </p>
            </div>
            <ChevronRight className="size-4 text-outline mt-0.5 group-hover:text-sbr-blue transition-colors" />
        </Link>
    );
}
