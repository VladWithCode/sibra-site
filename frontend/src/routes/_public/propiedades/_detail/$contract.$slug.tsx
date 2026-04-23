import { ContactForm } from "@/components/contact/ContactForm";
import { FloatingCTA } from "@/components/floatingCTA";
import { SqMtIcon } from "@/components/icons/icons";
import { PropertyImage } from "@/components/Image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormatMetric, FormatMoney } from "@/lib/format";
import { MapsAPIProvider, PropertyLocationMap } from "@/maps";
import { getPropertyBySlugOpts } from "@/queries/properties";
import { createPropInfoRequestOpts } from "@/queries/quotes";
import type { TProperty } from "@/queries/type";
import { useUIStore } from "@/stores/uiStore";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bath, Bed, Home, XIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { DynamicIcon } from "lucide-react/dynamic";

const inquiryFormSchema = z.object({
    name: z.string().min(1, "El nombre no puede estar vacío"),
    phone: z.string()
        .min(1, "El número de teléfono no puede estar vacío")
        .max(10, "El número de teléfono no puede tener más de 10 caracteres"),
    consent: z.literal(true, "Debes aceptar que te contactemos para agendar una cita."),
});

export const Route = createFileRoute("/_public/propiedades/_detail/$contract/$slug")({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        await context.queryClient.ensureQueryData(
            getPropertyBySlugOpts(params.slug, params.contract),
        );
    },
});

function HeroSection({ property }: { property: TProperty }) {
    const [open, setOpen] = useState(false);
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(1);

    useEffect(() => {
        if (!api) return;
        setCurrent(api.selectedScrollSnap() + 1);
        api.on("select", () => setCurrent(api.selectedScrollSnap() + 1));
    }, [api]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <section className="relative w-full aspect-[4/5] md:aspect-[4/3] lg:aspect-video overflow-hidden bg-surface-container md:rounded-xl">
                <motion.div
                    className="w-full h-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <DialogTrigger className="w-full h-full p-0 cursor-pointer" asChild>
                        <PropertyImage
                            className="w-full h-full object-cover hover:scale-105 active:scale-95"
                            propId={property.id}
                            propName={property.address}
                            src={property.mainImg}
                        />
                    </DialogTrigger>
                </motion.div>
                <DialogTrigger asChild>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="absolute z-10 bottom-4 right-4 glass border-none px-4 py-2 rounded-lg shadow-lg active:scale-95 active:shadow-sm"
                    >
                        <span className="text-[10px] font-sans font-bold tracking-widest text-primary uppercase">1 / {property.imgs?.length || 0} Fotos</span>
                    </motion.p>
                </DialogTrigger>
                <div className="absolute top-4 left-4 flex gap-2">
                    <motion.span
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <Badge className="bg-primary-container">Oferta</Badge>
                    </motion.span>
                    <motion.span
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.25 }}
                    >
                        <Badge className="bg-surface-container-lowest text-primary-container capitalize" variant="secondary">{property.contract}</Badge>
                    </motion.span>
                </div>
            </section>
            <DialogContent
                showCloseButton={false}
                className="lg:max-w-4/5 lg:max-h-[95vh] flex flex-col bg-transparent border-none p-0 shadow-none"
            >
                <DialogClose className="fixed z-10 top-4 right-4">
                    <XIcon className="text-primary-foreground stroke-3" />
                </DialogClose>
                <DialogTitle className="sr-only">Galería de fotos: {property.address}</DialogTitle>
                <Carousel className="w-full h-full mt-auto md:[&>div]:h-[80vh] lg:[&>div]:h-[95vh]" setApi={setApi} opts={{ loop: true }}>
                    <CarouselContent className="h-full">
                        {property.imgs?.map((img, i) => (
                            <CarouselItem key={`${img}-${i}`}>
                                <div
                                    className="flex items-center justify-center w-full h-full aspect-[4/5] bg-center bg-contain bg-no-repeat sm:aspect-video overflow-hidden"
                                    style={{
                                        "backgroundImage": "url(/static/properties/" + property.id + "/" + img + ")",
                                    }}
                                >
                                    {/* <PropertyImage */}
                                    {/*     className="max-w-full max-h-full w-auto h-full object-contain" */}
                                    {/*     propId={property.id} */}
                                    {/*     propName={property.address} */}
                                    {/*     src={img} */}
                                    {/* /> */}
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2 sm:-left-12 top-1/2 -translate-y-1/2 bg-white/90" />
                    <CarouselNext className="right-2 sm:-right-12 bg-white/90" />
                </Carousel>
                <p className="lg:absolute lg:top-6 lg:inset-x-0 text-center text-sm font-sans font-bold tracking-widest text-white/80 uppercase">
                    {current} / {property.imgs?.length || 0} Fotos
                </p>
                <div className="lg:absolute lg:bottom-0 lg:inset-x-0 flex justify-between gap-3 text-on-primary mt-auto p-4">
                    <Button
                        variant="outline"
                        className="flex-1 bg-surface-container-low/30 backdrop-blur-md"
                        onClick={() => setOpen(false)}
                        asChild
                    >
                        {/* @ts-ignore */}
                        <Link to="#formulario-contacto">Solicitar Precalificación</Link>
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={() => setOpen(false)}
                        asChild
                    >
                        {/* @ts-ignore */}
                        <Link to="#formulario-cita">Agendar Cita</Link>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function TitlePriceBlock({ property }: { property: TProperty }) {
    return (
        <section className="p-3 md:p-0 bg-surface-container-low md:bg-transparent">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-surface-container-lowest rounded-lg border-2 border-sbr-green/40"
            >
                <div className="flex flex-col gap-2 p-6">
                    <span className="text-primary font-sans text-[11px] uppercase tracking-[0.2em] font-bold">{property.state}, {property.city}</span>
                    <h1 className="text-3xl font-sans font-extrabold text-on-surface tracking-tight leading-tight">
                        {property.address} {property.nbHood}, {property.zip}
                    </h1>
                    <p className="text-2xl font-sans font-bold text-primary-container mt-2">{FormatMoney(property.price)}</p>
                </div>
                <div className="grid grid-cols-4 gap-3 p-6 mt-3 mb-6 border-y border-outline-variant/15 text-on-surface/60">
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col justify-center items-center gap-2.5"
                    >
                        <Bed className="size-5" />
                        <span className="text-sm font-sans font-bold">{property.beds} Hab.</span>
                    </motion.div>
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col justify-center items-center gap-2.5"
                    >
                        <Bath className="size-5" />
                        <span className="text-sm font-sans font-bold">{property.baths} Baños</span>
                    </motion.div>
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col justify-center items-center gap-2.5"
                    >
                        <SqMtIcon className="size-5" />
                        <span className="text-sm font-sans font-bold">{FormatMetric(property.sqMt)}²</span>
                    </motion.div>
                    <motion.div
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col items-center gap-1"
                    >
                        <Home className="size-6" />
                        <span className="text-sm font-sans font-bold capitalize">{property.propertyType}</span>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    )
}

function ArchitecturalVision({ property }: { property: TProperty }) {
    return (
        <section className="p-3 md:p-0 bg-surface-container-low md:bg-transparent">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="bg-surface-container-lowest border-2 border-sbr-green/40 rounded-lg p-6 space-y-6"
            >
                <h2 className="text-xl font-sans font-bold text-on-surface flex items-center gap-3">
                    Vision Arquitectónica
                    <div className="h-px flex-1 bg-outline-variant/20" />
                </h2>
                <div className="space-y-4">
                    <p className="text-on-surface-variant leading-relaxed font-sans">
                        {property.description}
                    </p>
                </div>
            </motion.div>
        </section>
    )
}

function AmenitiesGrid({ property }: { property: TProperty }) {
    return (
        <section className="p-3 md:p-0">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
            >
                <h2 className="text-xl font-sans font-bold text-on-surface mb-8">Amenidades</h2>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    {property.amenities.map((amty, i) => (
                        <motion.div
                            key={amty.id}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="flex flex-col gap-3 items-center p-4 rounded-xl bg-surface-container-lowest shadow-sm text-on-surface-variant border border-outline-variant/10"
                        >
                            <DynamicIcon name={amty.icon as unknown as any} className="shrink-0 grow-0 size-8" />
                            <span className="text-sm font-semibold">{amty.title}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    )
}

function InquiryForm({ property }: { property: TProperty }) {
    const propInfoMut = useMutation(createPropInfoRequestOpts(property.id));

    const form = useForm({
        defaultValues: {
            name: "",
            phone: "",
            consent: false as boolean,
        },
        validators: {
            onSubmit: inquiryFormSchema,
        },
        onSubmit: async ({ value }) => {
            try {
                await propInfoMut.mutateAsync({
                    infoRequest: {
                        name: value.name,
                        phone: value.phone,
                        property: property.id,
                    },
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

    return (
        <section className="p-3 md:p-0" id="formulario-contacto">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
            >
            </motion.div>
            <div className="bg-surface-container-lowest rounded-lg p-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border-2 border-sbr-green/40 transition-shadow hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
                <div className="mb-8">
                    <h2 className="text-2xl font-sans font-extrabold text-on-surface">Contactanos</h2>
                    <p className="text-sm text-on-surface-variant mt-2">Si deseas conocer la propiedad o recibir asesoria de un agente SIBRA, mandanos tus datos.</p>
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
                                <label htmlFor={field.name} className="block text-[10px] font-sans font-bold text-primary uppercase tracking-[0.1em] ml-1">Nombre</label>
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
                                <label htmlFor={field.name} className="block text-[10px] font-sans font-bold text-primary uppercase tracking-[0.1em] ml-1">Teléfono</label>
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
                                    {isSubmitting || propInfoMut.isPending ? "Enviando..." : "Solicitar Contacto"}
                                </Button>
                            </motion.div>
                        )}
                    />
                </form>
            </div>
        </section>
    )
}

function QuoteFormSection({ property }: { property: TProperty }) {
    return (
        <section className="p-3 md:p-0" id="formulario-cita">
            <div className="bg-surface-container-lowest p-6 rounded-lg  shadow-[0_20px_50px_rgba(0,0,0,0.04)] border-2 border-sbr-green/40">
                <h2 className="text-2xl font-semibold mb-8">Agenda tu cita</h2>
                <ContactForm viewDetail="simple" forPropertyID={property.id} />
            </div>
        </section>
    );
}

function LocationContext({ property }: { property: TProperty }) {
    return (
        <section className="p-3 md:p-0">
            <motion.div
                className="bg-surface-container-lowest rounded-lg border-2 border-sbr-green/40"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
            >
                <h2 className="text-2xl font-sans font-bold text-on-surface p-6">Ubicación</h2>
                <div className="p-2">
                    <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-200 relative group">
                        <MapsAPIProvider>
                            <PropertyLocationMap property={property} />
                        </MapsAPIProvider>
                    </div>
                </div>
            </motion.div>
        </section>
    )
}

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
        <main className="pb-12">
            <MobileLayout property={property} />
            <BigScreenLayout property={property} />
            <FloatingCTA />
        </main>
    )
}

function MobileLayout({ property }: { property: TProperty }) {
    return (
        <div className="md:hidden">
            <HeroSection property={property} />
            <TitlePriceBlock property={property} />
            <ArchitecturalVision property={property} />
            {property.features?.length > 0 && <AmenitiesGrid property={property} />}
            <InquiryForm property={property} />
            <QuoteFormSection property={property} />
            <LocationContext property={property} />
        </div>
    )
}

function BigScreenLayout({ property }: { property: TProperty }) {
    return (
        <div className="hidden md:block md:max-w-screen-xl md:mx-auto md:px-6 lg:px-10 md:pt-6">
            <div className="md:grid md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_400px] md:gap-6 lg:gap-8 md:items-start">

                {/* Left column: hero image, description, amenities, map */}
                <div className="md:space-y-6">
                    <HeroSection property={property} />
                    <ArchitecturalVision property={property} />
                    {property.features?.length > 0 && <AmenitiesGrid property={property} />}
                    <LocationContext property={property} />
                </div>

                {/* Right column: price block + contact forms, sticky on desktop */}
                <div className="md:sticky md:top-4 md:self-start md:space-y-4">
                    <TitlePriceBlock property={property} />
                    <InquiryForm property={property} />
                    <QuoteFormSection property={property} />
                </div>
            </div>
        </div>
    )
}

