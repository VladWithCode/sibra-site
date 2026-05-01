import type { TUserDetail } from "@/queries/type";
import { Link } from "@tanstack/react-router";
import { Edit2, Trash2 } from "lucide-react";
import { useState } from "react";
import { UserRoleBadge } from "./UserRoleBadge";
import { UserDeleteDialog } from "./UserDeleteDialog";

export function UserRowCard({ user }: { user: TUserDetail }) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const detailHref = { to: "/panel/usuarios/$id" as string, params: { id: user.id } };

    return (
        <div className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <Link
                        {...detailHref}
                        className="text-sm font-bold text-on-surface hover:text-sbr-blue line-clamp-1"
                    >
                        {user.name}
                    </Link>
                    <p className="text-xs text-outline mt-0.5">
                        @{user.username} &middot; {user.email}
                    </p>
                    <p className="text-xs text-outline mt-0.5">{user.phone}</p>
                </div>
                <UserRoleBadge role={user.role} />
            </div>

            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-outline-variant/20">
                <Link
                    {...detailHref}
                    aria-label="Editar usuario"
                    className="p-2 text-slate-400 hover:text-sbr-blue hover:bg-sbr-blue/5 rounded-lg transition-all"
                >
                    <Edit2 className="size-4" />
                </Link>
                <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
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
        </div>
    );
}
