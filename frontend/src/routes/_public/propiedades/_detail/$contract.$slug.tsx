import { ShareIcon, SqMtIcon } from "@/components/icons/icons";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { FormatMoney } from "@/lib/format";
import { PropertyLocationMap } from "@/maps";
import { getPropertyBySlugOpts } from "@/queries/properties";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bed, CheckCircle2, Heart, Info, Toilet } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { useUIStore } from "@/stores/uiStore";
import {
    ContactFormDatePicker,
    QuoteTypeSelector,
    type TDatePickerItem,
    type TQuoteType,
} from "@/components/properties/quote-ui";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PropertyImageCarousel } from "@/components/properties/PropertyImageCarousel";
import { format, set } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { PropertyCarousel } from "@/components/properties/PropertySlider";
import { createQuote } from "@/queries/quotes";
import type { TQuote, TQuoteCreateResult } from "@/queries/type";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { LikeButton } from "@/components/properties/likeButton";

export const Route = createFileRoute("/_public/propiedades/_detail/$contract/$slug")({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        await context.queryClient.ensureQueryData(
            getPropertyBySlugOpts(params.slug, params.contract),
        );
    },
});

function RouteComponent() {
    const { slug, contract } = Route.useParams();
    const { data } = useSuspenseQuery(getPropertyBySlugOpts(slug, contract));
    const property = data.property;

    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();
    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplementProps({ complementType: "search" });
    }, []);

    return (
        <main className="col-start-1 col-span-1 w-full">
            <div className="relative w-full aspect-[3/2]">
                <div className="relative w-full h-full z-0 overflow-hidden">
                    {property.imgs?.length > 0 ? (
                        <PropertyImageCarousel property={property} />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100">
                            <p className="text-lg font-semibold text-center text-muted-foreground">
                                No hay imágenes disponibles
                            </p>
                        </div>
                    )}
                </div>
                <div className="absolute top-0 right-0 flex gap-3 p-3">
                    <Button
                        className="rounded-full p-5 text-muted-foreground bg-gray-50 shadow-sm"
                        variant="secondary"
                        size="icon"
                    >
                        <ShareIcon className="size-5" />
                    </Button>
                    <LikeButton className="rounded-full p-5 text-muted-foreground bg-gray-50 shadow-sm" propData={property} />
                </div>
            </div>
            <div className="bg-gray-200 text-gray-800 px-6 py-3 space-y-3 overflow-hidden">
                <p className="flex items-center gap-3 uppercase text-sm text-current/60 font-bold">
                    <span className="block w-4 aspect-square bg-sbr-green rounded-full"></span>
                    {property.contract}
                </p>
                <p className="text-3xl font-bold">{FormatMoney(property.price)}</p>
                <ul className="flex items-center gap-3 text-sm xs:text-base text-current/80">
                    <li className="flex items-center gap-1.5 font-bold align-bottom">
                        <span>{property.beds} Req.</span>
                        <span>
                            <Bed />{" "}
                        </span>
                    </li>
                    <span className="block w-2 aspect-square rounded-full bg-gray-500"></span>
                    <li className="flex items-center gap-1.5 font-bold align-bottom">
                        <span>{property.baths} Baños</span>
                        <span>
                            <Toilet />{" "}
                        </span>
                    </li>
                    <span className="block w-2 aspect-square rounded-full bg-gray-500"></span>
                    <li className="flex items-center gap-1.5 font-bold align-bottom">
                        <span>{property.sqMt} Mt²</span>
                        <span>
                            <SqMtIcon />{" "}
                        </span>
                    </li>
                </ul>
                <h1 className="text-sm font-medium text-current/60">
                    {property.address}, C.P. {property.zip}, {property.nbHood}. {property.city},{" "}
                    {property.state}
                </h1>
                <p className="text-destructive font-semibold">
                    <a className="flex items-center gap-1" href="https://infonavit.com">
                        Puntos Infonavit
                        <Info className="size-4 fill-destructive stroke-gray-50" />
                    </a>
                </p>
                <div className="bg-gray-50 border-2 border-sbr-green rounded-lg px-3 py-6">
                    <ContactFormDialog forPropertyID={property.id}>
                        <Button
                            className="flex-col items-start text-base text-start whitespace-normal p-0 h-auto"
                            variant="ghost"
                        >
                            <h3 className="text-lg font-bold">Detalles de la casa</h3>
                            <p className="text-current/60">{property.description}</p>
                        </Button>
                    </ContactFormDialog>
                </div>
                <div className="relative z-0 bg-gray-50 border-2 border-sbr-green rounded-lg overflow-hidden">
                    <h3 className="absolute top-3 left-3 z-10 bg-gray-50 rounded text-lg font-bold px-1.5 shadow-md">
                        Mapa
                    </h3>
                    <div className="w-full aspect-[3/2] p-0.5 rounded-lg">
                        {!!property.lat && !!property.lon ? (
                            <PropertyLocationMap property={property} fullscreenControl={true} />
                        ) : (
                            <div className="flex items-center justify-center h-full bg-gray-100">
                                <p className="text-lg font-semibold text-center text-muted-foreground">
                                    Pronto agregaremos la ubicación de la propiedad
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                <div className="relative bg-gray-50 border-2 border-sbr-green rounded-lg px-3 py-6 space-y-3 z-0">
                    <h3 className="text-lg font-bold">¿Quieres conocerla?</h3>
                    <ContactForm viewDetail="simple" forPropertyID={property.id} />
                </div>
                <div className="flex justify-between border-y-2 border-sbr-green font-semibold text-center">
                    <h3 className="flex-1 text-lg py-2 px-4">Llama ahora</h3>
                    <span className="shrink-0 grow-0 basis-0.5 bg-sbr-green-light my-2"></span>
                    <a href="tel:526188744569" className="flex-1 py-2 px-4">
                        (618) 874 45 69
                    </a>
                </div>
                <div className="space-y-3">
                    <h3 className="text-lg font-bold">Propiedades recomendadas</h3>
                    {data.nearbyProperties ? (
                        <PropertyCarousel properties={data.nearbyProperties} />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100 p-3 rounded-lg shadow">
                            <p className="font-semibold text-center text-muted-foreground">
                                Parece que no encontramos más propiedades similares.
                            </p>
                        </div>
                    )}
                </div>
                <div className="space-y-3">
                    <h3 className="text-lg font-bold">Propiedades cercanas</h3>
                    {data.nearbyProperties ? (
                        <PropertyCarousel properties={data.nearbyProperties} />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-100 p-3 rounded-lg shadow">
                            <p className="font-semibold text-center text-muted-foreground">
                                Parece que no encontramos más propiedades cercanas.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

const ContactFormSchema = z.object({
    quoteDate: z
        .date({ error: "La fecha de la cita no es válida" })
        .min(new Date(), "La fecha de la cita no puede ser anterior a hoy"),
    quoteType: z.enum(["presencial", "whatsapp"], {
        error: "Debes elegir una cita presencial o atención por whatsapp/llamada teléfonica",
    }),
    phone: z
        .string({ error: "El número de teléfono es obligatorio" })
        .min(10, "El número de teléfono debe tener al menos 10 dígitos"),
    name: z
        .string()
        .optional()
        .or(z.string().min(2, "El nombre no puede ser menor a 2 caracteres")),
});

type contactFormSchemaType = z.infer<typeof ContactFormSchema>;

function ContactForm({
    viewDetail,
    forPropertyID,
    onSuccess,
}: {
    viewDetail: "simple" | "complete";
    forPropertyID?: string;
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
        } as TQuote;

        try {
            const res = await quoteMutation.mutateAsync(quoteData);
            animateSuccess();
            toast.success("Se ha creado la cita", { closeButton: true });
            if (typeof onSuccess === "function") {
                onSuccess(res);
            }
        } catch (e) {
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

function ContactFormDialog({
    children,
    forPropertyID,
    onSuccess,
}: {
    forPropertyID?: string;
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
                />
            </DialogContent>
        </Dialog>
    );
}
