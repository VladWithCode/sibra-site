import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_public/propiedades/_listing/")({
    component: RouteComponent,
    beforeLoad: () => {
        // Redirect if no contract is provided
        throw redirect({ to: "/propiedades/venta" });
    },
});

function RouteComponent() {
    const { setHeaderFloating, setHeaderComplement } = useUIStore();
    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplement("search");
    }, []);

    return (
        <div>
            <h1>Listado de propiedades</h1>
        </div>
    );
}
