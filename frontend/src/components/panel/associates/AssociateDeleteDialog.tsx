import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { deleteAssociateOpts } from '@/queries/projects';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export function AssociateDeleteDialog({
    associateId,
    associateLabel,
    open,
    onOpenChange,
}: {
    associateId: string;
    associateLabel: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const mut = useMutation(deleteAssociateOpts(associateId));

    const onConfirm = () => {
        mut.mutate(undefined, {
            onSuccess: () => {
                toast.success('El asociado ha sido eliminado correctamente.', {
                    closeButton: true,
                });
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
                        Esta accion no se puede deshacer. Quieres eliminar a{' '}
                        <span className="font-semibold text-on-surface">
                            {associateLabel}
                        </span>
                        ?
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
                        {mut.isPending ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
