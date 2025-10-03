import { createQuote } from "@/queries/quotes";
import type { TQuote, TQuoteCreateResult, TQuotePropType, TQuoteType } from "@/queries/type";
import { useGSAP } from "@gsap/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { ContactFormDatePicker, QuoteTypeSelector, type TDatePickerItem } from "../properties/quote-ui";
import { format, set } from "date-fns";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

export const ContactFormSchema = z.object({
    quoteDate: z
        .date({ error: "La fecha de la cita no es válida" })
        .min(new Date(), "La fecha de la cita no puede ser anterior a hoy"),
    quoteType: z.enum(["presencial", "whatsapp"], {
        error: "Debes elegir una cita presencial o atención por whatsapp/llamada teléfonica",
    }).default("presencial"),
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
    const quoteMutation = useMutation({
        mutationFn: createQuote,
    });
    const isViewComplete = viewDetail === "complete";
    const formRef = useRef<HTMLFormElement>(undefined);
    const form = useForm<contactFormSchemaType>({
        resolver: zodResolver(ContactFormSchema),
        defaultValues: {
            quoteDate: new Date(),
            quoteType: "presencial",
            propType: propType || "propiedad",
            phone: "",
            name: isViewComplete ? "" : undefined,
        },
    });
    const [generalError, setGeneralError] = useState("");
    const { contextSafe } = useGSAP({ scope: formRef.current });
    const animateSuccess = contextSafe(() => {
        gsap.to("#quote-form-success", {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: "power1.inOut",
            onComplete: () => {
                gsap.delayedCall(2, () => {
                    gsap.to("#quote-form-success", {
                        opacity: 0,
                        scale: 0,
                        duration: 0.3,
                        ease: "power1.inOut",
                    });
                });
            },
        });
    });
    const onDateChange = useCallback(
        (item: TDatePickerItem) => {
            const nextDate = set(form.getValues("quoteDate"), {
                year: item.value.getFullYear(),
                month: item.value.getMonth(),
                date: item.value.getDate(),
            });
            form.setValue("quoteDate", nextDate);
            return nextDate;
        },
        [form],
    );
    const onTimeChange = useCallback(
        (time: Date) => {
            const nextTime = set(form.getValues("quoteDate"), {
                hours: time.getHours(),
                minutes: time.getMinutes(),
                seconds: 0,
            });
            form.setValue("quoteDate", nextTime);
            return nextTime;
        },
        [form],
    );
    const onQuoteTypeChange = useCallback(
        (type: TQuoteType) => {
            form.setValue("quoteType", type);
        },
        [form],
    );
    const onQuoteSubmit = async (values: contactFormSchemaType) => {
        const quoteData: TQuote = {
            name: values.name || "",
            phone: values.phone,
            type: values.quoteType,
            scheduledDate: values.quoteDate.toISOString(),
            property: forPropertyID || "",
            propType: propType || "propiedad",
        } as TQuote;

        try {
            const res = await quoteMutation.mutateAsync(quoteData);
            animateSuccess();
            toast.success("Se ha creado la cita", { closeButton: true });
            if (typeof onSuccess === "function") {
                onSuccess(res);
            }
        } catch (e: any) {
            toast.error(e.message || "Ocurrió un error al crear la cita", {
                closeButton: true,
            });
            setGeneralError(e.message || "Ocurrió un error al crear la cita");
            console.error(e);
        }
    };
    const onInvalidSubmit = (errors: any) => {
        console.log(errors);
        toast.error("El formulario no es válido", { closeButton: true });
    };

    return (
        <Form {...form}>
            <form
                className="w-full space-y-6 overflow-hidden"
                onSubmit={form.handleSubmit(onQuoteSubmit, onInvalidSubmit)}
                ref={formRef as unknown as React.RefObject<HTMLFormElement>}
            >
                <div
                    id="quote-form-success"
                    className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-white z-10 rounded-lg p-6 opacity-0 scale-0"
                >
                    <CheckCircle2 className="text-sbr-green size-32" />
                    <p className="text-xl font-bold text-center text-sbr-green">
                        Se ha generado tu solicitud con éxito
                    </p>
                </div>
                <FormField
                    control={form.control}
                    name="quoteDate"
                    render={({ field }) => (
                        <FormItem className="grid-cols-1 grid-rows-[auto_1fr] gap-4 w-full">
                            <FormLabel>Elige la fecha</FormLabel>
                            <FormControl>
                                <Input
                                    type="hidden"
                                    {...field}
                                    value={field.value.toISOString()}
                                />
                            </FormControl>
                            <ContactFormDatePicker onChange={onDateChange} />
                            <FormMessage className="px-0.5" />
                        </FormItem>
                    )}
                />
                {isViewComplete && (
                    <FormField
                        control={form.control}
                        name="quoteDate"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Hora</FormLabel>
                                <FormControl>
                                    <Input
                                        className="w-fit"
                                        type="time"
                                        id="quoteDate-time"
                                        name="quoteDate-time"
                                        min="06:00"
                                        max="23:00"
                                        onChange={(e) => {
                                            const dateValue = new Date(
                                                `2020-01-02T${e.target.value}`,
                                            );
                                            onTimeChange(dateValue);
                                        }}
                                        value={format(field.value, "HH:mm")}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <FormField
                    control={form.control}
                    name="quoteType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo de cita</FormLabel>
                            <FormControl>
                                <Input type="hidden" {...field} value={field.value} />
                            </FormControl>
                            <QuoteTypeSelector onChange={onQuoteTypeChange} />
                            <FormMessage className="px-0.5" />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Teléfono</FormLabel>
                            <FormControl>
                                <Input
                                    type="tel"
                                    className="bg-gray-50"
                                    placeholder="Número de teléfono"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage className="px-0.5" />
                        </FormItem>
                    )}
                />
                {isViewComplete && (
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        className="bg-gray-50"
                                        placeholder="Nombre"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="px-0.5" />
                            </FormItem>
                        )}
                    />
                )}
                <FormMessage className="text-base font-semibold px-1">
                    {generalError}
                </FormMessage>
                <div className="flex items-center justify-end">
                    <Button className="text-base" size="lg" type="submit">
                        Enviar
                    </Button>
                </div>
            </form>
        </Form>
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
            if (typeof onSuccess === "function") {
                onSuccess(result);
            }
            setRequestSuccess(true);
        },
        [onSuccess],
    );

    useEffect(() => {
        let timerId: NodeJS.Timeout;
        if (requestSuccess) {
            timerId = setTimeout(() => {
                if (!triggerRef.current) return;

                triggerRef.current.click();
            }, 2000);
        }

        return () => {
            if (timerId) {
                clearTimeout(timerId);
            }
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
