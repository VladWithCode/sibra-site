import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/panel/proyectos/$id/asociados')({
    component: RouteComponent,
})

function RouteComponent() {
    return <Outlet />
}
