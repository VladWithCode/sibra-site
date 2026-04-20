import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteProjectOpts } from "@/queries/projects";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function ProjectDeleteDialog({
    projectId,
    projectLabel,
    open,
    onOpenChange,
}: {
    projectId: string;
    projectLabel: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const mut = useMutation(deleteProjectOpts(projectId));

    const onConfirm = () => {
        mut.mutate(undefined, {
            onSuccess: () => {
                toast.success("El proyecto ha sido eliminado correctamente.", { closeButton: true });
                onOpenChange(false);
            },
            onError: (err) => {
                toast.error(err.message, { closeButton: true });
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar eliminacion</DialogTitle>
                    <DialogDescription>
                        Esta accion no se puede deshacer. Quieres eliminar <span className="font-semibold text-on-surface">{projectLabel}</span>?
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
                        {mut.isPending ? "Eliminando..." : "Eliminar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
