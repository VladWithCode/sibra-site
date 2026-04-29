import { createContactRequestOpts } from "@/queries/quotes";
import { useMutation } from "@tanstack/react-query";
import z from "zod";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useForm } from "@tanstack/react-form";
import { Checkbox } from "../ui/checkbox";


export const contactFormSchema = z.object({
    name: z.string().min(2, "El nombre no puede estar vacío"),
    phone: z.string().min(10, "El número de teléfono debe tener 10 dígitos"),
    type: z.enum(["informacion", "cita", "venta", "precalificacion", "proyecto"]).default("informacion"),
    consent: z.boolean().refine(v => v === true, "Debes aceptar que te contactemos para enviar tu solicitud"),
});

export type formSchemaType = z.infer<typeof contactFormSchema>;

export function InfoForm({ contactType, formTitle, submitLabel }: {
    contactType?: formSchemaType["type"];
    formTitle?: string;
    submitLabel?: string;
}) {
    const propInfoMut = useMutation(createContactRequestOpts());

    const form = useForm({
        defaultValues: {
            name: "",
            phone: "",
            consent: false as boolean,
            type: contactType || "informacion",
        },
        validators: {
            onSubmit: contactFormSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                await propInfoMut.mutateAsync({
                    contactRequest: {
                        name: value.name,
                        phone: value.phone,
                        type: value.type,
                    }
                });
                toast.success("Tu solicitud fue enviada. Te contactaremos pronto.", { closeButton: true });
                form.reset();
            } catch (err) {
                toast.error(
                    err instanceof Error ? err.message : "Ocurrió un error al enviar la solicitud.",
                    { closeButton: true },
                );
            }
        },
    });

    submitLabel = submitLabel || "Solicitar Contacto";

    return (
        <div className="bg-surface-container-lowest rounded-lg p-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
            <div className="mb-8">
                <h2 className="text-2xl font-sans font-extrabold text-on-surface">{formTitle || "Contactanos"}</h2>
            </div>
            <form
                className="space-y-6"
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <form.Field
                    name="name"
                    children={(field) => (
                        <div className="space-y-1">
                            <label htmlFor={field.name} className="block text-tiny font-sans font-bold text-primary uppercase tracking-[0.1em] ml-1">Nombre</label>
                            <Input
                                id={field.name}
                                name={field.name}
                                type="text"
                                placeholder="Martin Felix"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="w-full px-4 py-4 bg-surface-container-high rounded border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-outline/50"
                            />
                            {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
                                <p className="text-xs text-destructive ml-1 mt-1">
                                    {field.state.meta.errors.map((err) => err?.message).filter(Boolean).join(", ")}
                                </p>
                            ) : null}
                        </div>
                    )}
                />
                <form.Field
                    name="phone"
                    children={(field) => (
                        <div className="space-y-1">
                            <label htmlFor={field.name} className="block text-tiny font-sans font-bold text-primary uppercase tracking-[0.1em] ml-1">Teléfono</label>
                            <Input
                                id={field.name}
                                name={field.name}
                                type="tel"
                                placeholder="6181594681"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="w-full px-4 py-4 bg-surface-container-high rounded border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-outline/50"
                            />
                            {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
                                <p className="text-xs text-destructive ml-1 mt-1">
                                    {field.state.meta.errors.map((err) => err?.message).filter(Boolean).join(", ")}
                                </p>
                            ) : null}
                        </div>
                    )}
                />
                <form.Field
                    name="consent"
                    children={(field) => (
                        <div className="space-y-2">
                            <div className="flex items-start gap-3">
                                <Checkbox
                                    id={field.name}
                                    name={field.name}
                                    checked={field.state.value}
                                    onBlur={field.handleBlur}
                                    onCheckedChange={(v) => field.handleChange(v === true)}
                                    className="mt-0.5"
                                    required
                                />
                                <label htmlFor={field.name} className="text-xs text-on-surface-variant leading-snug">
                                    Acepto que se me contacte a través de Whatsapp o llamada telefónica.
                                </label>
                            </div>
                            {field.state.meta.isTouched && field.state.meta.errors.length > 0 ? (
                                <p className="text-xs text-destructive ml-1">
                                    {field.state.meta.errors.map((err) => err?.message).filter(Boolean).join(", ")}
                                </p>
                            ) : null}
                        </div>
                    )}
                />
                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting] as const}
                    children={([canSubmit, isSubmitting]) => (
                        <motion.div whileTap={{ scale: 0.98 }}>
                            <Button
                                type="submit"
                                disabled={!canSubmit || propInfoMut.isPending}
                                className="w-full bg-gradient-to-r from-sbr-blue to-primary-container text-primary-foreground font-sans font-bold rounded shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                            >
                                {isSubmitting || propInfoMut.isPending ? "Enviando..." : submitLabel}
                            </Button>
                        </motion.div>
                    )}
                />
            </form>
        </div>
    )
}
