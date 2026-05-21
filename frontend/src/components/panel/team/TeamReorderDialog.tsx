import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { updateTeamMemberOpts } from "@/queries/team";
import type { TTeamMember } from "@/queries/team";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function TeamReorderDialog({
    member,
    allMembers,
    open,
    onOpenChange,
}: {
    member: TTeamMember;
    allMembers: TTeamMember[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const mut = useMutation(updateTeamMemberOpts(member.id));
    const [newPosition, setNewPosition] = useState(member.position);

    const maxPosition = allMembers.length > 0 ? Math.max(...allMembers.map((m) => m.position)) : 0;

    const onConfirm = () => {
        mut.mutate(
            { id: member.id, position: newPosition },
            {
                onSuccess: () => {
                    toast.success("Orden actualizado correctamente.", { closeButton: true });
                    onOpenChange(false);
                },
                onError: (err) => {
                    toast.error(err.message, { closeButton: true });
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Reordenar miembro</DialogTitle>
                    <DialogDescription>
                        Cambia la posición de <span className="font-semibold text-on-surface">{member.name}</span> en la lista.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <label className="text-sm font-medium mb-2 block">Posición (0 = primero)</label>
                    <input
                        type="number"
                        min={0}
                        max={maxPosition}
                        value={newPosition}
                        onChange={(e) => setNewPosition(parseInt(e.target.value, 10) || 0)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={mut.isPending}>
                        Cancelar
                    </Button>
                    <Button type="button" onClick={onConfirm} disabled={mut.isPending}>
                        {mut.isPending ? "Guardando…" : "Guardar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
