import { Button } from "@/components/ui/button";
import type { TTeamMember } from "@/queries/team";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { TeamDeleteDialog } from "./TeamDeleteDialog";
import { TeamReorderDialog } from "./TeamReorderDialog";

export function TeamTable({ teamMembers, isLoading }: { teamMembers: TTeamMember[]; isLoading: boolean }) {
    const [deleteTarget, setDeleteTarget] = useState<TTeamMember | null>(null);
    const [reorderTarget, setReorderTarget] = useState<TTeamMember | null>(null);

    if (isLoading) {
        return <div className="text-center py-8 text-muted-foreground">Cargando...</div>;
    }

    if (teamMembers.length === 0) {
        return (
            <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">No hay miembros del equipo registrados.</p>
            </div>
        );
    }

    return (
        <>
            <div className="rounded-lg border bg-card overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-surface-container-low text-left">
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold w-16">Orden</th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold w-20">Foto</th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">Nombre</th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">Rol</th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold text-right w-24">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                        {teamMembers.map((member) => (
                            <tr key={member.id} className="hover:bg-surface-container-low/50">
                                <td className="px-6 py-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => setReorderTarget(member)}
                                    >
                                        <span className="text-xs font-medium">{member.position}</span>
                                    </Button>
                                </td>
                                <td className="px-6 py-3">
                                    <div className="h-10 w-10 rounded-full overflow-hidden bg-muted">
                                        {member.photoUrl ? (
                                            <img src={member.photoUrl} alt={member.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs font-bold">
                                                {member.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-3 font-medium">{member.name}</td>
                                <td className="px-6 py-3 text-muted-foreground">{member.role || "—"}</td>
                                <td className="px-6 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                            <a href={`/panel/equipo/${member.id}`}>
                                                <Edit className="h-3.5 w-3.5" />
                                            </a>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => setDeleteTarget(member)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {deleteTarget && (
                <TeamDeleteDialog
                    memberId={deleteTarget.id}
                    memberName={deleteTarget.name}
                    open={!!deleteTarget}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                />
            )}

            {reorderTarget && (
                <TeamReorderDialog
                    member={reorderTarget}
                    allMembers={teamMembers}
                    open={!!reorderTarget}
                    onOpenChange={(open) => !open && setReorderTarget(null)}
                />
            )}
        </>
    );
}
