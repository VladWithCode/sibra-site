import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export function UsersHeader() {
    return (
        <div className="flex items-end justify-between gap-4 mb-8 lg:mb-10">
            <div>
                <span className="block text-tiny tracking-[0.15em] uppercase text-sbr-blue font-bold">
                    Panel
                </span>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-on-surface mt-1 tracking-tight">
                    Usuarios
                </h2>
            </div>
            <Button asChild size="sm" className="gap-2">
                <Link to="/panel/usuarios/nuevo">
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">Nuevo usuario</span>
                    <span className="sm:hidden">Nuevo</span>
                </Link>
            </Button>
        </div>
    );
}
