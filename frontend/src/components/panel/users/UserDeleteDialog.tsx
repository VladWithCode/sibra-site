import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteUserOpts } from "@/queries/users";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function UserDeleteDialog({
    userId,
    userLabel,
    open,
    onOpenChange,
}: {
    userId: string;
    userLabel: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const mut = useMutation(deleteUserOpts(userId));

    const onConfirm = () => {
        mut.mutate(
            { id: userId },
            {
                onSuccess: () => {
                    toast.success("El usuario ha sido eliminado correctamente.", { closeButton: true });
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
                        Esta acción no se puede deshacer. ¿Quieres eliminar al usuario <span className="font-semibold text-on-surface">{userLabel}</span>?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                        disabled={mut.isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={mut.isPending}
                    >
                        {mut.isPending ? "Eliminando…" : "Eliminar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
