import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deletePropertyOpts } from "@/queries/properties";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function PropertyDeleteDialog({
    propertyId,
    propertyLabel,
    open,
    onOpenChange,
}: {
    propertyId: string;
    propertyLabel: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const mut = useMutation(deletePropertyOpts(propertyId));

    const onConfirm = () => {
        mut.mutate(
            { id: propertyId },
            {
                onSuccess: () => {
                    toast.success("La propiedad ha sido eliminada correctamente.", { closeButton: true });
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
                        Esta acción no se puede deshacer. ¿Quieres eliminar <span className="font-semibold text-on-surface">{propertyLabel}</span>?
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
