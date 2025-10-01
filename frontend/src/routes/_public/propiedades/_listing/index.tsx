import { useUIStore } from "@/stores/uiStore";
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
    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();
    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplementProps({ complementType: "search" });
    }, []);

    return (
        <div>
            <h1>Listado de propiedades</h1>
        </div>
    );
}
