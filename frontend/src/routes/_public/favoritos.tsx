import { PropertyCard } from "@/components/properties/PropertyCard";
import { useSavedProperties } from "@/hooks/useSavedProperties";
import { useUIStore } from "@/stores/uiStore";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_public/favoritos")({
    component: RouteComponent,
});

function RouteComponent() {
    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();
    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplementProps({ complementType: "none" });
    }, []);
    const { properties, status } = useSavedProperties()

    if (status === "error") {
        return (
            <div className="px-6 py-12">
                <p className="text-center text-red-500">Ocurrió un error inesperado. Intenta de nuevo más tarde.</p>
            </div>
        );
    } else if (status === "pending") {
        return (
            <div className="px-6 py-12">
                <p className="text-center text-gray-500">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="px-6 py-12 space-y-12">
            <h1 className="text-3xl font-bold">Propiedades guardadas</h1>
            <div className="grid gap-6">
                {
                    properties?.length > 0 ?
                        properties.map(prop => (
                            <PropertyCard key={prop.id} propData={prop} />
                        )) :
                        <p className="col-span-full row-span-full text-center text-gray-500">
                            No se encontraron propiedades guardadas.
                        </p>
                }
            </div>
        </div>
    );
}
