import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export function ProjectsHeader() {
    return (
        <div className="flex items-end justify-between gap-4 mb-8 lg:mb-10">
            <div>
                <span className="block text-[10px] tracking-[0.15em] uppercase text-sbr-blue font-bold">
                    Inventario
                </span>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-on-surface mt-1 tracking-tight">
                    Proyectos
                </h2>
            </div>
            <Button asChild size="sm" className="gap-2">
                <Link to="/panel/proyectos/nuevo">
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">Nuevo proyecto</span>
                    <span className="sm:hidden">Nuevo</span>
                </Link>
            </Button>
        </div>
    );
}
