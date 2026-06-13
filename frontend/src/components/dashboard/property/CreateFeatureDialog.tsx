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
import { Textarea } from "@/components/ui/textarea";
import { createFeatureOpts } from "@/queries/features";
import type { TPropertyFeature } from "@/queries/type";
import { useMutation } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";
import { toast } from "sonner";
import { toIconName } from "./LucideIcon";

export function CreateFeatureDialog({
    onCreated,
    children,
}: PropsWithChildren<{ onCreated: (feature: TPropertyFeature) => void }>) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [icon, setIcon] = useState("");
    const [description, setDescription] = useState("");
    const [touched, setTouched] = useState(false);
    const mutation = useMutation(createFeatureOpts());

    const titleError = touched && title.trim().length === 0 ? "El título es obligatorio" : null;
    const iconError = touched && icon.trim().length === 0 ? "El ícono es obligatorio" : null;

    const reset = () => {
        setTitle("");
        setIcon("");
        setDescription("");
        setTouched(false);
    };

    const onSubmit = async () => {
        setTouched(true);
        if (!title.trim() || !icon.trim()) return;
        try {
            const created = await mutation.mutateAsync({
                title: title.trim(),
                icon: toIconName(icon),
                description: description.trim(),
            });
            toast.success("Característica creada", { closeButton: true });
            onCreated(created);
            setOpen(false);
            reset();
        } catch (e: any) {
            toast.error(e?.message || "Error al crear la característica", {
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
                    <DialogTitle>Nueva característica</DialogTitle>
                    <DialogDescription>
                        Define una nueva característica reutilizable del catálogo.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Field>
                        <FieldLabel htmlFor="feature-title">Título</FieldLabel>
                        <Input
                            id="feature-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej. Piscina infinita"
                        />
                        {titleError ? (
                            <FieldError errors={[{ message: titleError }]} />
                        ) : null}
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="feature-icon">Ícono (Lucide)</FieldLabel>
                        <LucideIconPicker id="feature-icon" value={icon} onChange={setIcon} />
                        {iconError ? (
                            <FieldError errors={[{ message: iconError }]} />
                        ) : null}
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="feature-description">Descripción</FieldLabel>
                        <Textarea
                            id="feature-description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
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
