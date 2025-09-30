import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/politica-de-privacidad")({
    component: RouteComponent,
});

function RouteComponent() {
    return <div>Hello "/_public/politica-de-privacidad"!</div>;
}
