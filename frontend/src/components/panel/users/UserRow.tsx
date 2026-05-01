import type { TUserDetail } from "@/queries/type";
import { Link, useNavigate } from "@tanstack/react-router";
import { Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { UserRoleBadge } from "./UserRoleBadge";
import { UserDeleteDialog } from "./UserDeleteDialog";

export function UserRow({ user }: { user: TUserDetail }) {
    const navigate = useNavigate();
    const [deleteOpen, setDeleteOpen] = useState(false);

    const detailHref = { to: "/panel/usuarios/$id" as string, params: { id: user.id } };

    const onRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
        const target = e.target as HTMLElement;
        if (target.closest('button,[data-button-wrapper]')) {
            return;
        }
        navigate(detailHref);
    }
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
            aria-label={`Ver detalle de ${user.name}`}
        >
            <td className="px-6 py-5">
                <div className="min-w-0">
                    <p className="text-sm font-bold text-on-surface line-clamp-1">
                        {user.name}
                    </p>
                    <p className="text-xs text-outline">@{user.username}</p>
                </div>
            </td>
            <td className="px-6 py-5">
                <p className="text-sm text-on-surface-variant line-clamp-1">
                    {user.email}
                </p>
            </td>
            <td className="px-6 py-5">
                <p className="text-sm text-on-surface-variant">
                    {user.phone}
                </p>
            </td>
            <td className="px-6 py-5">
                <UserRoleBadge role={user.role} />
            </td>
            <td className="px-6 py-5 text-right">
                <div
                    className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
                    data-button-wrapper
                >
                    <Link
                        {...detailHref}
                        onClick={stop}
                        aria-label="Editar usuario"
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
                        aria-label="Eliminar usuario"
                        className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all"
                    >
                        <Trash2 className="size-4" />
                    </button>
                </div>
                <UserDeleteDialog
                    userId={user.id}
                    userLabel={user.name}
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                />
            </td>
        </tr>
    );
}
