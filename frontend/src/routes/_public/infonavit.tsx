import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/infonavit")({
    component: RouteComponent,
});

function RouteComponent() {
    return <div>Hello "/_public/infonavit"!</div>;
}
