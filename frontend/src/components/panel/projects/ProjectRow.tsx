import { ImgPlaceholder } from "@/components/ui/img-placeholder";
import type { TProject } from "@/queries/type";
import { Link, useNavigate } from "@tanstack/react-router";
import { Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { ProjectDeleteDialog } from "./ProjectDeleteDialog";

export function ProjectRow({ project }: { project: TProject }) {
    const navigate = useNavigate();
    const [deleteOpen, setDeleteOpen] = useState(false);

    const detailHref = { to: "/panel/proyectos/$id", params: { id: project.id } } as const;
    const imgSrc = project.main_img ? `/static/uploads/${project.main_img}` : undefined;

    const onRowClick = () => navigate(detailHref);
    const onRowKey = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            navigate(detailHref);
        }
    };
    const stop = (e: React.MouseEvent | React.KeyboardEvent) => e.stopPropagation();

    return (
        <tr
            className="group cursor-pointer hover:bg-surface-bright transition-colors duration-300"
            onClick={onRowClick}
            onKeyDown={onRowKey}
            tabIndex={0}
            role="link"
            aria-label={`Ver detalle de ${project.name}`}
        >
            <td className="px-6 py-5">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                        {imgSrc ? (
                            <img
                                src={imgSrc}
                                alt={project.name}
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <ImgPlaceholder className="w-full h-full" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <Link
                            {...detailHref}
                            onClick={stop}
                            className="text-sm font-bold text-on-surface line-clamp-1 hover:text-sbr-blue"
                        >
                            {project.name}
                        </Link>
                        <p className="text-xs text-outline line-clamp-1">
                            {project.slug}
                        </p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-5">
                <p className="text-sm text-on-surface-variant line-clamp-1">
                    {project.location}
                </p>
            </td>
            <td className="px-6 py-5">
                <p className="text-sm font-bold text-on-surface">
                    {project.total_area.toLocaleString("es-MX")} m²
                </p>
            </td>
            <td className="px-6 py-5">
                <p className="text-sm font-bold text-on-surface">
                    {project.available_lots}{" "}
                    <span className="font-normal text-outline">/ {project.lot_count}</span>
                </p>
                <p className="text-[11px] text-outline">disponibles</p>
            </td>
            <td className="px-6 py-5 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
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
                <ProjectDeleteDialog
                    projectId={project.id}
                    projectLabel={project.name}
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                />
            </td>
        </tr>
    );
}
