import { createFileRoute, Outlet } from '@tanstack/react-router';
import { getProjectOpts } from '@/queries/projects';

export const Route = createFileRoute('/panel/proyectos/$id')({
    component: () => <Outlet />,
    loader: async ({ context, params }) => {
        const data = await context.queryClient.ensureQueryData(getProjectOpts(params.id));
        return { projectName: data.project.name };
    },
});
