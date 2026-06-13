import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { LucideIconPicker } from "@/components/dashboard/LucideIconPicker";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createAmenityOpts } from "@/queries/amenities";
import type { TPropertyAmenity } from "@/queries/type";
import { useMutation } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";
import { toast } from "sonner";
import { toIconName } from "./LucideIcon";

export function CreateAmenityDialog({
    onCreated,
    children,
}: PropsWithChildren<{ onCreated: (amenity: TPropertyAmenity) => void }>) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [icon, setIcon] = useState("");
    const [touched, setTouched] = useState(false);
    const mutation = useMutation(createAmenityOpts());

    const titleError = touched && title.trim().length === 0 ? "El título es obligatorio" : null;
    const iconError = touched && icon.trim().length === 0 ? "El ícono es obligatorio" : null;

    const reset = () => {
        setTitle("");
        setIcon("");
        setTouched(false);
    };

    const onSubmit = async () => {
        setTouched(true);
        if (!title.trim() || !icon.trim()) return;
        try {
            const created = await mutation.mutateAsync({
                title: title.trim(),
                icon: toIconName(icon),
            });
            toast.success("Amenidad creada", { closeButton: true });
            onCreated(created);
            setOpen(false);
            reset();
        } catch (e: any) {
            toast.error(e?.message || "Error al crear la amenidad", {
                closeButton: true,
            });
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(v) => {
                setOpen(v);
                if (!v) reset();
            }}
        >
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Nueva amenidad</DialogTitle>
                    <DialogDescription>
                        Define una nueva amenidad reutilizable del catálogo.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Field>
                        <FieldLabel htmlFor="amenity-title">Título</FieldLabel>
                        <Input
                            id="amenity-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej. Gimnasio"
                        />
                        {titleError ? (
                            <FieldError errors={[{ message: titleError }]} />
                        ) : null}
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="amenity-icon">Ícono (Lucide)</FieldLabel>
                        <LucideIconPicker id="amenity-icon" value={icon} onChange={setIcon} />
                        {iconError ? (
                            <FieldError errors={[{ message: iconError }]} />
                        ) : null}
                    </Field>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={onSubmit}
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? "Guardando..." : "Crear"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
