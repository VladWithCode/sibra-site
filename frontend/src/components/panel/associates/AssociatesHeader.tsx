import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { ArrowLeft, Link2, Plus } from 'lucide-react';

export function AssociatesHeader({
    projectId,
    projectName,
}: {
    projectId: string;
    projectName: string;
}) {
    return (
        <div className="flex items-end justify-between gap-4 mb-8 lg:mb-10">
            <div>
                <Link
                    to="/panel/asociados"
                    className="inline-flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-sbr-blue font-bold hover:underline"
                >
                    <ArrowLeft className="size-3" />
                    {projectName}
                </Link>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-on-surface mt-1 tracking-tight">
                    Asociados
                </h2>
            </div>
            <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="outline" className="gap-2">
                    <Link
                        to="/panel/proyectos/$id/asociados/vincular"
                        params={{ id: projectId }}
                    >
                        <Link2 className="size-4" />
                        <span className="hidden sm:inline">Vincular asociado</span>
                        <span className="sm:hidden">Vincular</span>
                    </Link>
                </Button>
                <Button asChild size="sm" className="gap-2">
                    <Link
                        to="/panel/proyectos/$id/asociados/nuevo"
                        params={{ id: projectId }}
                    >
                        <Plus className="size-4" />
                        <span className="hidden sm:inline">Nuevo asociado</span>
                        <span className="sm:hidden">Nuevo</span>
                    </Link>
                </Button>
            </div>
        </div>
    );
}
