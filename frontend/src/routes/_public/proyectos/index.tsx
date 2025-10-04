import { ProjectCard } from '@/components/projects/ProjectCard';
import { getProjectsOpts } from '@/queries/projects';
import { queryClient } from '@/queries/queryClient';
import { useUIStore } from '@/stores/uiStore';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react';

export const Route = createFileRoute('/_public/proyectos/')({
    component: RouteComponent,
    loader: async () => {
        await queryClient.ensureQueryData(getProjectsOpts)
    },
})

function RouteComponent() {
    const { data } = useSuspenseQuery(getProjectsOpts);
    const projects = data.projects;

    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();
    useEffect(() => {
        setHeaderFloating(true);
        setHeaderComplementProps({ complementType: "none" });
    }, []);

    return (
        <main className="bg-gray-200">
            <section className="relative z-0 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src="/sample.webp" alt="" className="w-full h-full object-cover object-center brightness-80" />
                </div>
                <div className="relative z-10 text-gray-50 px-6 sm:px-12 pt-20 sm:pt-24 lg:pt-32 xl:pt-36 2xl:pt-44 pb-12 lg:pb-16 xl:pb-20 2xl:pb-28 bg-linear-to-b from-sbr-blue-dark/60 to-sbr-blue-light/60">
                    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 2xl:space-y-10">
                        <h1 className="text-3xl sm:text-5xl xl:text-6xl 2xl:text-7xl font-semibold">Proyectos Sibra</h1>
                        <p className="text-muted font-medium">
                            En Sibra nos interesa brindarle a nuestros clientes las mejores opciones para
                            comenzar y expandir su patrimonio. Por eso, nos dedicamos a crear y desarrollar
                            proyectos inmobiliarios que ofrezcan grandes oportunidades para ellos.
                        </p>
                    </div>
                </div>
            </section>
            <section className="relative z-0 max-w-7xl grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-6 px-4 py-12 mx-auto">
                {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </section>

        </main>
    );
}
