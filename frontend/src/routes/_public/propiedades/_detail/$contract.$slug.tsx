import { ShareIcon, SqMtIcon } from '@/components/icons/icons';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FormatMoney } from '@/lib/format';
import { PropertyLocationMap } from '@/maps';
import { getPropertyBySlugOpts } from '@/queries/properties';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router'
import { Bed, Heart, Info, Toilet } from 'lucide-react';
import { useCallback, useEffect, type PropsWithChildren } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { useUIStore } from '@/stores/uiStore';
import { ContactFormDatePicker, QuoteTypeSelector, type TDatePickerItem, type TQuoteType } from '@/components/properties/quote-ui';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { PropertyImageCarousel } from '@/components/properties/PropertyImageCarousel';
import { format, set } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PropertyCarousel } from '@/components/properties/PropertySlider';

export const Route = createFileRoute(
    '/_public/propiedades/_detail/$contract/$slug',
)({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        await context.queryClient.ensureQueryData(
            getPropertyBySlugOpts(params.slug, params.contract)
        );
    },
})

function RouteComponent() {
    const { slug, contract } = Route.useParams();
    const { data } = useSuspenseQuery(getPropertyBySlugOpts(slug, contract));
    const property = data.property;

    const { setHeaderFloating, setHeaderComplement } = useUIStore();
    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplement('search');
    }, []);

    return (
        <main className="col-start-1 col-span-1 w-full">
            <div className="relative w-full aspect-[3/2]">
                <div className="relative w-full h-full z-0 overflow-hidden">
                    {
                        property.imgs?.length > 0 ?
                            <PropertyImageCarousel property={property} /> :
                            <div className="flex items-center justify-center h-full bg-gray-100">
                                <p className="text-lg font-semibold text-center text-muted-foreground">
                                    No hay imágenes disponibles
                                </p>
                            </div>
                    }
                </div>
                <div className="absolute top-0 right-0 flex gap-3 p-3">
                    <Button className="rounded-full p-5 text-muted-foreground bg-gray-50 shadow-sm" variant="secondary" size="icon">
                        <ShareIcon className="size-5" />
                    </Button>
                    <Button className="rounded-full p-5 text-muted-foreground bg-gray-50 shadow-sm" variant="secondary" size="icon">
                        <Heart className="size-5" />
                    </Button>
                </div>
            </div>
            <div className="bg-gray-200 text-gray-800 px-6 py-3 space-y-3 overflow-hidden">
                <p className="flex items-center gap-3 uppercase text-sm text-current/60 font-bold">
                    <span className="block w-4 aspect-square bg-sbr-green rounded-full"></span>
                    {property.contract}
                </p>
                <p className="text-3xl font-bold">
                    {FormatMoney(property.price)}
                </p>
                <ul className="flex items-center gap-3 text-sm xs:text-base text-current/80">
                    <li className="flex items-center gap-1.5 font-bold align-bottom">
                        <span>{property.beds} Req.</span>
                        <span><Bed /> </span>
                    </li>
                    <span className="block w-2 aspect-square rounded-full bg-gray-500"></span>
                    <li className="flex items-center gap-1.5 font-bold align-bottom">
                        <span>{property.baths} Baños</span>
                        <span><Toilet /> </span>
                    </li>
                    <span className="block w-2 aspect-square rounded-full bg-gray-500"></span>
                    <li className="flex items-center gap-1.5 font-bold align-bottom">
                        <span>{property.sqMt} Mt²</span>
                        <span><SqMtIcon /> </span>
                    </li>
                </ul>
                <h1 className="text-sm font-medium text-current/60">
                    {property.address}, C.P. {property.zip}, {property.nbHood}. {property.city}, {property.state}
                </h1>
                <p className="text-destructive font-semibold">
                    <a className="flex items-center gap-1" href="https://infonavit.com">
                        Puntos Infonavit
                        <Info className="size-4 fill-destructive stroke-gray-50" />
                    </a>
                </p>
                <div className="bg-gray-50 border-2 border-sbr-green-light rounded-lg px-3 py-6">
                    <ContactFormDialog>
                        <Button className="flex-col items-start text-base text-start whitespace-normal p-0 h-auto" variant="ghost">
                            <h3 className="text-lg font-bold">Detalles de la casa</h3>
                            <p className="text-current/60">{property.description}</p>
                        </Button>
                    </ContactFormDialog>
                </div>
                <div className="relative z-0 bg-gray-50 border-2 border-sbr-green-light rounded-lg overflow-hidden">
                    <h3 className="absolute top-3 left-3 z-10 bg-gray-50 rounded text-lg font-bold px-1.5 shadow-md">Mapa</h3>
                    <div className="w-full aspect-[3/2] p-0.5 rounded-lg">
                        <PropertyLocationMap
                            property={property}
                            fullscreenControl={true}
                        />
                    </div>
                </div>
                <div className="bg-gray-50 border-2 border-sbr-green-light rounded-lg px-3 py-6 space-y-3">
                    <h3 className="text-lg font-bold">¿Quieres conocerla?</h3>
                    <ContactForm viewDetail='simple' />
                </div>
                <div className="flex justify-between border-y-2 border-sbr-green-light font-semibold">
                    <h3 className="flex-1 text-lg py-2 px-4">Llama ahora</h3>
                    <span className="shrink-0 grow-0 basis-0.5 bg-sbr-green-light my-2"></span>
                    <a href="tel:526188744569" className="flex-1 py-2 px-4">(618) 874 45 69</a>
                </div>
                <div className="space-y-3">
                    <h3 className="text-lg font-bold">Propiedades recomendadas</h3>
                    {
                        data.nearbyProperties ?
                            <PropertyCarousel properties={data.nearbyProperties} /> :
                            <div className="flex items-center justify-center h-full bg-gray-100 p-3 rounded-lg shadow">
                                <p className="font-semibold text-center text-muted-foreground">
                                    Parece que no encontramos más propiedades similares.
                                </p>
                            </div>
                    }
                </div>
                <div className="space-y-3">
                    <h3 className="text-lg font-bold">Propiedades cercanas</h3>
                    {
                        data.nearbyProperties ?
                            <PropertyCarousel properties={data.nearbyProperties} /> :
                            <div className="flex items-center justify-center h-full bg-gray-100 p-3 rounded-lg shadow">
                                <p className="font-semibold text-center text-muted-foreground">
                                    Parece que no encontramos más propiedades cercanas.
                                </p>
                            </div>
                    }
                </div>
            </div>
        </main>
    );
}

const ContactFormSchema = z.object({
    quoteDate: z.date({ error: "La fecha de la cita no es válida" })
        .min(new Date(), "La fecha de la cita no puede ser anterior a hoy"),
    quoteType: z.enum(["presencial", "whatsapp"], {
        error: "Debes elegir una cita presencial o atención por whatsapp/llamada teléfonica",
    }),
    phone: z.string({ error: "El número de teléfono es obligatorio" }).min(10, "El número de teléfono debe tener al menos 10 dígitos"),
    name: z.string().optional().or(z.string().min(2, "El nombre no puede ser menor a 2 caracteres")),
});

type contactFormSchemaType = z.infer<typeof ContactFormSchema>;

function ContactForm({ viewDetail }: { viewDetail: 'simple' | 'complete' }) {
    const isViewComplete = viewDetail === 'complete';
    const form = useForm<contactFormSchemaType>({
        resolver: zodResolver(ContactFormSchema),
        defaultValues: {
            quoteDate: new Date(),
            quoteType: "presencial",
            phone: "",
            name: isViewComplete ? "" : undefined,
        },
    });
    const onDateChange = useCallback((item: TDatePickerItem) => {
        const nextDate = set(form.getValues("quoteDate"), {
            year: item.value.getFullYear(),
            month: item.value.getMonth(),
            date: item.value.getDate(),
        });
        form.setValue("quoteDate", nextDate);
        return nextDate;
    }, [form]);
    const onTimeChange = useCallback((time: Date) => {
        const nextTime = set(form.getValues("quoteDate"), {
            hours: time.getHours(),
            minutes: time.getMinutes(),
            seconds: 0,
        });
        form.setValue("quoteDate", nextTime)
        return nextTime;
    }, [form]);
    const onQuoteTypeChange = useCallback((type: TQuoteType) => {
        form.setValue("quoteType", type);
    }, [form]);
    const onQuoteSubmit = (values: contactFormSchemaType) => {
        console.log(values);
        setTimeout(() => {
            toast.success("Se ha enviado la cita", { closeButton: true });
        }, 300);
    }
    const onInvalidSubmit = (errors: any) => {
        console.log(errors);
        toast.error("El formulario no es válido", { closeButton: true });
    }

    return (
        <Form {...form}>
            <form
                className="w-full space-y-6 overflow-hidden"
                onSubmit={form.handleSubmit(onQuoteSubmit, onInvalidSubmit)}
            >
                <FormField
                    control={form.control}
                    name="quoteDate"
                    render={({ field }) => (
                        <FormItem className="grid-cols-1 grid-rows-[auto_1fr] gap-4 w-full">
                            <FormLabel>Elige la fecha</FormLabel>
                            <FormControl>
                                <Input type="hidden" {...field} value={field.value.toISOString()} />
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
                                        onChange={e => {
                                            const dateValue = new Date(`2020-01-02T${e.target.value}`);
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
                                <Input type="tel" className="bg-gray-50" placeholder="Número de teléfono" {...field} />
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
                                    <Input type="text" className="bg-gray-50" placeholder="Nombre" {...field} />
                                </FormControl>
                                <FormMessage className="px-0.5" />
                            </FormItem>
                        )}
                    />
                )}
                <div className="py-3">
                    <FormMessage>
                    </FormMessage>
                </div>
                <div className="flex items-center justify-end">
                    <Button className="text-base" size="lg" type="submit">Enviar</Button>
                </div>
            </form>
        </Form>
    )
}

function ContactFormDialog({ children }: {} & PropsWithChildren) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="w-[90%] max-w-lg">
                <DialogHeader>
                    <DialogTitle>Agenda tu cita</DialogTitle>
                    <DialogDescription>Proporciona tus datos para que podamos agendar tu cita</DialogDescription>
                </DialogHeader>
                <ContactForm viewDetail='complete' />
            </DialogContent>
        </Dialog>
    );
}
