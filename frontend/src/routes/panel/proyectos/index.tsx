import { ProjectsHeader } from '@/components/panel/projects/ProjectsHeader';
import { ProjectsSearch } from '@/components/panel/projects/ProjectsSearch';
import { ProjectsTable } from '@/components/panel/projects/ProjectsTable';
import { getProjectsOpts } from '@/queries/projects';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { z } from 'zod';

const PanelProjectsSearchSchema = z.object({
    q: z.string().optional().catch(undefined),
});

export const Route = createFileRoute('/panel/proyectos/')({
    component: RouteComponent,
    validateSearch: (search) => PanelProjectsSearchSchema.parse(search),
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(getProjectsOpts);
    },
});

function RouteComponent() {
    const search = Route.useSearch();
    const { data, isLoading } = useQuery(getProjectsOpts);

    const projects = data?.projects ?? [];

    const filtered = useMemo(() => {
        if (!search.q) return projects;
        const term = search.q.toLowerCase();
        return projects.filter(
            (p) =>
                p.name.toLowerCase().includes(term) ||
                p.location.toLowerCase().includes(term),
        );
    }, [projects, search.q]);

    return (
        <main className="p-4 sm:p-6 lg:p-8">
            <ProjectsHeader />
            <div className="mb-6">
                <ProjectsSearch q={search.q} />
            </div>
            <ProjectsTable projects={filtered} isLoading={isLoading} />
        </main>
    );
}
