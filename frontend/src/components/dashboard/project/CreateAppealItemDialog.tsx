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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createAppealItemOpts } from "@/queries/projects";
import type { TProjectAppealItem } from "@/queries/type";
import { useMutation } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";
import { toast } from "sonner";

export function CreateAppealItemDialog({
    onCreated,
    children,
}: PropsWithChildren<{ onCreated: (item: TProjectAppealItem) => void }>) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [touched, setTouched] = useState(false);
    const mutation = useMutation(createAppealItemOpts());

    const nameError = touched && name.trim().length === 0 ? "El nombre es obligatorio" : null;

    const reset = () => {
        setName("");
        setDescription("");
        setTouched(false);
    };

    const onSubmit = async () => {
        setTouched(true);
        if (!name.trim()) return;
        try {
            const result = await mutation.mutateAsync({
                name: name.trim(),
                description: description.trim(),
            });
            toast.success("Atractivo creado", { closeButton: true });
            onCreated(result.item);
            setOpen(false);
            reset();
        } catch (e: any) {
            toast.error(e?.message || "Error al crear el atractivo", {
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
                    <DialogTitle>Nuevo atractivo</DialogTitle>
                    <DialogDescription>
                        Define un atractivo reutilizable del catálogo.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Field>
                        <FieldLabel htmlFor="appeal-name">Nombre</FieldLabel>
                        <Input
                            id="appeal-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej. Vistas panorámicas"
                        />
                        {nameError ? <FieldError errors={[{ message: nameError }]} /> : null}
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="appeal-description">Descripción</FieldLabel>
                        <Textarea
                            id="appeal-description"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Breve descripción del atractivo..."
                        />
                    </Field>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                    </Button>
                    <Button type="button" onClick={onSubmit} disabled={mutation.isPending}>
                        {mutation.isPending ? "Guardando..." : "Crear"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
