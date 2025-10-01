import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/proyectos')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <>
            <Outlet />
        </>
    );
}
