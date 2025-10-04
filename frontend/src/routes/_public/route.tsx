import { PublicLayout } from "@/components/layout/publicLayout";
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_public")({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <PublicLayout>
            <Outlet />
        </PublicLayout>
    );
}
