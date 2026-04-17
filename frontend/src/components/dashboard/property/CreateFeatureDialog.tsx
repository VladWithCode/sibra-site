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
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createFeatureOpts } from "@/queries/features";
import type { TPropertyFeature } from "@/queries/type";
import { useMutation } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";
import { toast } from "sonner";
import { LucideIcon, resolveIconName } from "./LucideIcon";

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

    const iconResolved = resolveIconName(icon);
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
                icon: icon.trim(),
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
                        <div className="flex items-center gap-2">
                            <Input
                                id="feature-icon"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                placeholder="Ej. Waves"
                            />
                            <div className="bg-muted/40 flex size-9 items-center justify-center rounded-md border">
                                {iconResolved ? (
                                    <LucideIcon
                                        name={iconResolved}
                                        className="text-primary size-5"
                                    />
                                ) : (
                                    <span className="text-muted-foreground text-xs">?</span>
                                )}
                            </div>
                        </div>
                        <FieldDescription>
                            Nombre de un ícono de{" "}
                            <a
                                href="https://lucide.dev/icons"
                                target="_blank"
                                rel="noreferrer"
                                className="underline"
                            >
                                lucide.dev
                            </a>
                            . Ej: Waves, Wifi, Sun.
                        </FieldDescription>
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
