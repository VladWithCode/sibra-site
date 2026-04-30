import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { deleteQuoteOpts } from "@/queries/quotes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function RequestDeleteDialog({
    requestId,
    requestLabel,
    open,
    onOpenChange,
}: {
    requestId: string;
    requestLabel: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const queryClient = useQueryClient();
    const mut = useMutation({
        ...deleteQuoteOpts(requestId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quotes", "listing"] });
            toast.success("La solicitud ha sido eliminada correctamente.", { closeButton: true });
            onOpenChange(false);
        },
        onError: (err) => {
            toast.error(err.message, { closeButton: true });
        },
    });

    const onConfirm = () => {
        mut.mutate({ id: requestId });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmar eliminación</DialogTitle>
                    <DialogDescription>
                        Esta acción no se puede deshacer. ¿Quieres eliminar la solicitud de <span className="font-semibold text-on-surface">{requestLabel}</span>?
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
