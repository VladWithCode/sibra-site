import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/panel/proyectos/$id')({
    component: () => <Outlet />,
});
