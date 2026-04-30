import { createQuote } from "@/queries/quotes";
import type { TQuote, TQuoteCreateResult, TQuotePropType } from "@/queries/type";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from "react";
import z from "zod";
import { ContactFormDatePicker, QuoteTypeSelector, type TDatePickerItem } from "../properties/quote-ui";
import { format, set } from "date-fns";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Field, FieldError, FieldLabel } from "../ui/field";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

export const ContactFormSchema = z.object({
    quoteDate: z
        .date({ error: "La fecha de la cita no es válida" })
        .min(new Date(), "La fecha de la cita no puede ser anterior a hoy"),
    quoteType: z
        .enum(["informacion", "cita", "venta", "precalificacion", "proyecto"], {
            error: "Debes elegir una cita presencial o atención por whatsapp/llamada teléfonica",
        })
        .default("informacion"),
    propType: z
        .enum(["proyecto", "propiedad", "general"])
        .default("propiedad"),
    phone: z
        .string({ error: "El número de teléfono es obligatorio" })
        .min(10, "El número de teléfono debe tener al menos 10 dígitos"),
    name: z
        .string()
        .optional()
        .or(z.string().min(2, "El nombre no puede ser menor a 2 caracteres")),
});

export type contactFormSchemaType = z.infer<typeof ContactFormSchema>;

export function ContactForm({
    viewDetail,
    forPropertyID,
    propType,
    onSuccess,
}: {
    viewDetail: "simple" | "complete";
    /** forPropertyID is the ID of the property the user is requesting a quote for
      * if propType is "proyecto" or "propiedad", then forPropertyID is the ID of the project or property
      */
    forPropertyID?: string;
    propType?: "proyecto" | "propiedad" | "general";
    onSuccess?: (result: TQuoteCreateResult) => void;
}) {
    const quoteMutation = useMutation({ mutationFn: createQuote });
    const isViewComplete = viewDetail === "complete";
    const [showSuccess, setShowSuccess] = useState(false);

    const form = useForm({
        defaultValues: {
            quoteDate: new Date(),
            quoteType: "cita",
            propType: (propType || "propiedad") as "proyecto" | "propiedad" | "general",
            phone: "",
            name: isViewComplete ? "" : undefined,
        } satisfies contactFormSchemaType,
        validators: { onChange: ContactFormSchema },
        onSubmit: async ({ value }) => {
            const quoteData: TQuote = {
                name: value.name || "",
                phone: value.phone,
                type: value.quoteType,
                scheduledDate: value.quoteDate.toISOString(),
                property: forPropertyID || "",
                propType: propType || "propiedad",
            } as TQuote;

            try {
                const res = await quoteMutation.mutateAsync(quoteData);
                setShowSuccess(true);
                window.setTimeout(() => setShowSuccess(false), 2300);
                toast.success("Se ha creado la cita", { closeButton: true });
                onSuccess?.(res);
            } catch (e: any) {
                toast.error(e.message || "Ocurrió un error al crear la cita", {
                    closeButton: true,
                });
                console.error(e);
            }
        },
    });

    return (
        <form
            className="relative w-full space-y-6 overflow-hidden px-1"
            onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
            }}
        >
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        key="quote-form-success"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 rounded-lg bg-white p-6"
                    >
                        <CheckCircle2 className="text-sbr-green size-32" />
                        <p className="text-xl font-bold text-center text-sbr-green">
                            Se ha generado tu solicitud con éxito
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <form.Field
                name="quoteDate"
                children={(field) => (
                    <Field>
                        <FieldLabel htmlFor="quoteDate-date">Elige la fecha</FieldLabel>
                        <ContactFormDatePicker
                            onChange={(item: TDatePickerItem) => {
                                const next = set(field.state.value, {
                                    year: item.value.getFullYear(),
                                    month: item.value.getMonth(),
                                    date: item.value.getDate(),
                                });
                                field.handleChange(next);
                            }}
                        />
                        <FieldError errors={field.state.meta.errors as unknown as Array<{ message?: string }>} />
                    </Field>
                )}
            />

            {isViewComplete && (
                <form.Field
                    name="quoteDate"
                    children={(field) => (
                        <Field>
                            <FieldLabel htmlFor="quoteDate-time">Hora</FieldLabel>
                            <Input
                                className="w-fit"
                                type="time"
                                id="quoteDate-time"
                                name="quoteDate-time"
                                min="06:00"
                                max="23:00"
                                value={format(field.state.value, "HH:mm")}
                                onChange={(e) => {
                                    const t = new Date(`2020-01-02T${e.target.value}`);
                                    const next = set(field.state.value, {
                                        hours: t.getHours(),
                                        minutes: t.getMinutes(),
                                        seconds: 0,
                                    });
                                    field.handleChange(next);
                                }}
                            />
                            <FieldError errors={field.state.meta.errors as unknown as Array<{ message?: string }>} />
                        </Field>
                    )}
                />
            )}

            <form.Field
                name="phone"
                children={(field) => (
                    <Field>
                        <FieldLabel htmlFor={field.name}>Teléfono</FieldLabel>
                        <Input
                            id={field.name}
                            name={field.name}
                            type="tel"
                            className="bg-gray-50"
                            placeholder="Número de teléfono"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldError errors={field.state.meta.errors as unknown as Array<{ message?: string }>} />
                    </Field>
                )}
            />

            {isViewComplete && (
                <form.Field
                    name="name"
                    children={(field) => (
                        <Field>
                            <FieldLabel htmlFor={field.name}>Nombre</FieldLabel>
                            <Input
                                id={field.name}
                                name={field.name}
                                type="text"
                                className="bg-gray-50"
                                placeholder="Nombre"
                                value={field.state.value ?? ""}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                            />
                            <FieldError errors={field.state.meta.errors as unknown as Array<{ message?: string }>} />
                        </Field>
                    )}
                />
            )}

            <div className="flex items-center justify-end">
                <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                        <Button
                            className="text-base"
                            size="lg"
                            type="submit"
                            disabled={!canSubmit || isSubmitting}
                        >
                            Enviar
                        </Button>
                    )}
                />
            </div>
        </form>
    );
}

export function ContactFormDialog({
    children,
    forPropertyID,
    propType,
    onSuccess,
}: {
    forPropertyID?: string;
    propType?: TQuotePropType;
    onSuccess?: (result: TQuoteCreateResult) => void;
} & PropsWithChildren) {
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [requestSuccess, setRequestSuccess] = useState(false);
    const onSuccessCb = useCallback(
        (result: TQuoteCreateResult) => {
            onSuccess?.(result);
            setRequestSuccess(true);
        },
        [onSuccess],
    );

    useEffect(() => {
        let timerId: ReturnType<typeof setTimeout>;
        if (requestSuccess) {
            timerId = setTimeout(() => {
                if (!triggerRef.current) return;
                triggerRef.current.click();
            }, 2000);
        }
        return () => {
            if (timerId) clearTimeout(timerId);
        };
    }, [requestSuccess]);

    return (
        <Dialog>
            <DialogTrigger asChild ref={triggerRef}>
                {children}
            </DialogTrigger>
            <DialogContent className="w-[90%] max-w-lg">
                <DialogHeader>
                    <DialogTitle>Agenda tu cita</DialogTitle>
                    <DialogDescription>
                        Proporciona tus datos para que podamos agendar tu cita
                    </DialogDescription>
                </DialogHeader>
                <ContactForm
                    viewDetail="complete"
                    forPropertyID={forPropertyID}
                    onSuccess={onSuccessCb}
                    propType={propType}
                />
            </DialogContent>
        </Dialog>
    );
}
