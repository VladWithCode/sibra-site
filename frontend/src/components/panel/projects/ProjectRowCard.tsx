import { ImgPlaceholder } from "@/components/ui/img-placeholder";
import type { TProject } from "@/queries/type";
import { Link, useNavigate } from "@tanstack/react-router";
import { Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { ProjectDeleteDialog } from "./ProjectDeleteDialog";

export function ProjectRowCard({ project }: { project: TProject }) {
    const navigate = useNavigate();
    const [deleteOpen, setDeleteOpen] = useState(false);

    const detailHref = { to: "/panel/proyectos/$id", params: { id: project.id } } as const;
    const imgSrc = project.main_img ? `/static/uploads/${project.main_img}` : undefined;

    const onCardClick = () => navigate(detailHref);
    const onCardKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            navigate(detailHref);
        }
    };
    const stop = (e: React.MouseEvent | React.KeyboardEvent) => e.stopPropagation();

    return (
        <div
            role="link"
            tabIndex={0}
            aria-label={`Ver detalle de ${project.name}`}
            onClick={onCardClick}
            onKeyDown={onCardKey}
            className="group cursor-pointer bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 flex gap-4 hover:shadow-md hover:border-sbr-blue/30 transition-all"
        >
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={project.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <ImgPlaceholder className="w-full h-full" />
                )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1">
                <Link
                    {...detailHref}
                    onClick={stop}
                    className="text-sm font-bold text-on-surface line-clamp-1 hover:text-sbr-blue"
                >
                    {project.name}
                </Link>
                <p className="text-sm text-on-surface-variant line-clamp-1">
                    {project.location}
                </p>
                <p className="text-xs text-outline">
                    {project.total_area.toLocaleString("es-MX")} m² &middot; {project.available_lots} / {project.lot_count} lotes disponibles
                </p>
                <div className="mt-auto flex items-center justify-end gap-1 pt-2">
                    <Link
                        {...detailHref}
                        onClick={stop}
                        aria-label="Editar proyecto"
                        className="p-2 text-slate-400 hover:text-sbr-blue hover:bg-sbr-blue/5 rounded-lg transition-all"
                    >
                        <Edit2 className="size-4" />
                    </Link>
                    <button
                        type="button"
                        onClick={(e) => {
                            stop(e);
                            setDeleteOpen(true);
                        }}
                        aria-label="Eliminar proyecto"
                        className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all"
                    >
                        <Trash2 className="size-4" />
                    </button>
                </div>
            </div>
            <ProjectDeleteDialog
                projectId={project.id}
                projectLabel={project.name}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
            />
        </div>
    );
}
