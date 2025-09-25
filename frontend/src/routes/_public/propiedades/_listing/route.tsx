import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/propiedades/_listing')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <>
            <Outlet />
        </>
    );
}
