import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteTeamMemberOpts } from "@/queries/team";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function TeamDeleteDialog({
    memberId,
    memberName,
    open,
    onOpenChange,
}: {
    memberId: string;
    memberName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const mut = useMutation(deleteTeamMemberOpts());

    const onConfirm = () => {
        mut.mutate(
            { id: memberId },
            {
                onSuccess: () => {
                    toast.success("El miembro del equipo ha sido eliminado correctamente.", { closeButton: true });
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
                    <DialogTitle>Confirmar eliminación</DialogTitle>
                    <DialogDescription>
                        Esta acción no se puede deshacer. ¿Quieres eliminar a{" "}
                        <span className="font-semibold text-on-surface">{memberName}</span>?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={mut.isPending}>
                        Cancelar
                    </Button>
                    <Button type="button" variant="destructive" onClick={onConfirm} disabled={mut.isPending}>
                        {mut.isPending ? "Eliminando…" : "Eliminar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
