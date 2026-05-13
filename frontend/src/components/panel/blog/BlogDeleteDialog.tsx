import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { deleteBlogPostOpts } from "@/queries/blog";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function BlogDeleteDialog({
    postId,
    postTitle,
    open,
    onOpenChange,
    redirectOnSuccess,
}: {
    postId: string;
    postTitle: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    redirectOnSuccess?: boolean;
}) {
    const navigate = useNavigate();
    const mut = useMutation(deleteBlogPostOpts(postId));

    const onConfirm = () => {
        mut.mutate(
            { id: postId },
            {
                onSuccess: () => {
                    toast.success("Post eliminado correctamente.", { closeButton: true });
                    onOpenChange(false);
                    if (redirectOnSuccess) {
                        navigate({ to: "/panel/blog" });
                    }
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
                        Esta acción no se puede deshacer. ¿Quieres eliminar{" "}
                        <span className="font-semibold text-on-surface">{postTitle}</span>?
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
