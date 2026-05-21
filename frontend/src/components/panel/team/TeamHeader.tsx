import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export function TeamHeader() {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Administra los miembros del equipo que aparecen en "Nosotros".
                </p>
            </div>
            <Button asChild>
                <Link to="/panel/equipo/nuevo">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo miembro
                </Link>
            </Button>
        </div>
    );
}
