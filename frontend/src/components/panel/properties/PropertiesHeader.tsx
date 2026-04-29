import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export function PropertiesHeader() {
    return (
        <div className="flex items-end justify-between gap-4 mb-8 lg:mb-10">
            <div>
                <span className="block text-tiny tracking-[0.15em] uppercase text-sbr-blue font-bold">
                    Inventario
                </span>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-on-surface mt-1 tracking-tight">
                    Propiedades
                </h2>
            </div>
            <Button asChild size="sm" className="gap-2">
                <Link to="/panel/propiedades/nueva">
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">Nueva propiedad</span>
                    <span className="sm:hidden">Nueva</span>
                </Link>
            </Button>
        </div>
    );
}
