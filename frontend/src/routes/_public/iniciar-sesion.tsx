import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/iniciar-sesion")({
    component: RouteComponent,
});

function RouteComponent() {
    return <div>Hello "/_public/iniciar-sesion"!</div>;
}
