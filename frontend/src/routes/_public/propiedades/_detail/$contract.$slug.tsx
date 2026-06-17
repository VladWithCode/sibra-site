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
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormatMetric, FormatMoney } from "@/lib/format";
import { MapsAPIProvider, PropertyLocationMap } from "@/maps";
import { getPropertyBySlugOpts } from "@/queries/properties";
import { createPropInfoRequestOpts } from "@/queries/quotes";
import type { TProperty } from "@/queries/type";
import { useUIStore } from "@/stores/uiStore";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Bath, Bed, Home, XIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import z from "zod";
import { DynamicIcon } from "lucide-react/dynamic";

const inquiryFormSchema = z.object({
    name: z.string().min(1, "El nombre no puede estar vacío"),
    phone: z
        .string()
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
                        <span className="text-tiny font-sans font-bold tracking-widest text-primary uppercase">
                            1 / {property.imgs?.length || 0} Fotos
                        </span>
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
                        <Badge
                            className="bg-surface-container-lowest text-primary-container capitalize"
                            variant="secondary"
                        >
                            {property.contract}
                        </Badge>
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
                <DialogTitle className="sr-only">
                    Galería de fotos: {property.address}
                </DialogTitle>
                <Carousel
                    className="w-full h-full mt-auto md:[&>div]:h-[80vh] lg:[&>div]:h-[95vh]"
                    setApi={setApi}
                    opts={{ loop: true }}
                >
                    <CarouselContent className="h-full">
                        {property.imgs?.map((img, i) => (
                            <CarouselItem key={`${img}-${i}`}>
                                <div
                                    className="flex items-center justify-center w-full h-full aspect-[4/5] bg-center bg-contain bg-no-repeat sm:aspect-video overflow-hidden"
                                    style={{
                                        backgroundImage:
                                            "url(/static/properties/" +
                                            property.id +
                                            "/" +
                                            img +
                                            ")",
                                    }}
                                ></div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2 sm:-left-12 top-1/2 -translate-y-1/2 bg-white/90" />
                    <CarouselNext className="right-2 sm:-right-12 bg-white/90" />
                </Carousel>
                <p className="lg:absolute lg:top-6 lg:inset-x-0 text-center text-sm font-sans font-bold tracking-widest text-white/80 uppercase">
                    {current} / {property.imgs.length} Fotos
                </p>
            </DialogContent>
        </Dialog>
    );
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
                    <span className="text-primary font-sans text-[11px] uppercase tracking-[0.2em] font-bold">
                        {property.state}, {property.city}
                    </span>
                    <h1 className="text-3xl font-sans font-extrabold text-on-surface tracking-tight leading-tight">
                        {property.address}, {property.zip}
                    </h1>
                    <p className="text-2xl font-sans font-bold text-primary-container mt-2">
                        {FormatMoney(property.price)}
                    </p>
                </div>
            </motion.div>
        </section>
    );
}

const DETAIL_CATEGORIES = [
    { key: "interior", label: "Interior" },
    { key: "exterior", label: "Exterior" },
] as const;

// DynamicIcon resolves kebab-case lucide names; detail icons may be authored as
// "Bed", "Air Vent" or "air_vent", so normalize before lookup.
function toKebabIcon(name: string): string {
    return (name || "circle-help")
        .trim()
        .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
        .replace(/[\s_]+/g, "-")
        .toLowerCase();
}

function PropertyDetailsSection({ property }: { property: TProperty }) {
    const stats = [
        property.beds > 0 && {
            icon: <Bed className="size-5" />,
            val: String(property.beds),
            lbl: "Recámaras",
        },
        property.baths > 0 && {
            icon: <Bath className="size-5" />,
            val: String(property.baths),
            lbl: "Baños",
        },
        property.sqMt > 0 && {
            icon: <SqMtIcon className="size-5" />,
            val: FormatMetric(property.sqMt),
            sup: "m²",
            lbl: "Área",
        },
        property.propertyType && {
            icon: <Home className="size-5" />,
            val: property.propertyType,
            lbl: "Tipo",
            small: true,
        },
    ].filter(Boolean) as {
        icon: ReactNode;
        val: string;
        sup?: string;
        lbl: string;
        small?: boolean;
    }[];

    const details = property.details ?? [];
    const namedImages = property.namedImages ?? [];
    const hasContent = details.length > 0 || namedImages.length > 0;

    const categoriesWithContent = DETAIL_CATEGORIES.filter(
        (c) =>
            details.some((d) => d.category === c.key) ||
            namedImages.some((n) => n.category === c.key),
    );
    const defaultTab = categoriesWithContent[0]?.key ?? "interior";

    return (
        <section className="p-3 md:p-0">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="bg-surface-container-lowest border-2 border-sbr-green/40 rounded-lg p-6 md:p-8"
            >
                <p className="text-primary font-sans text-[11px] uppercase tracking-[0.2em] font-bold">
                    Ficha técnica
                </p>
                <h2 className="text-3xl font-sans font-extrabold text-on-surface tracking-tight mt-1">
                    Detalles de la propiedad
                </h2>

                {stats.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-7">
                        {stats.map((s, i) => (
                            <div
                                key={i}
                                className="flex flex-col gap-2.5 p-4 rounded-md border border-outline-variant/40 bg-surface-container-low"
                            >
                                <span className="text-sbr-blue">{s.icon}</span>
                                <span
                                    className={`font-sans font-bold leading-none text-on-surface ${s.small ? "text-xl capitalize" : "text-2xl"}`}
                                >
                                    {s.val}
                                    {s.sup && (
                                        <sup className="text-[0.55em] font-semibold ml-0.5">
                                            {s.sup}
                                        </sup>
                                    )}
                                </span>
                                <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                                    {s.lbl}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {hasContent && (
                    <>
                        <Tabs defaultValue={defaultTab} className="mt-8">
                            <TabsList className="bg-transparent p-0 h-auto w-full justify-start gap-7 border-b border-outline-variant/50 rounded-none">
                                {categoriesWithContent.map((c) => (
                                    <TabsTrigger
                                        key={c.key}
                                        value={c.key}
                                        className="bg-transparent rounded-none border-0 border-b-2 border-transparent px-0 pb-3 shadow-none data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:border-sbr-blue text-on-surface-variant data-[state=active]:text-on-surface font-medium data-[state=active]:font-bold"
                                    >
                                        {c.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            {categoriesWithContent.map((c) => (
                                <TabsContent key={c.key} value={c.key} className="pt-6">
                                    <CategoryPane
                                        property={property}
                                        images={namedImages.filter((n) => n.category === c.key)}
                                        details={details.filter((d) => d.category === c.key)}
                                    />
                                </TabsContent>
                            ))}
                        </Tabs>

                        <AllDetailsDialog
                            property={property}
                            details={details}
                            namedImages={namedImages}
                        />
                    </>
                )}
            </motion.div>
        </section>
    );
}

function CategoryPane({
    property,
    images,
    details,
}: {
    property: TProperty;
    images: TProperty["namedImages"];
    details: TProperty["details"];
}) {
    return (
        <div className="space-y-8">
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                    {images.map((img) => (
                        <figure key={img.id ?? img.image} className="group flex flex-col gap-2">
                            <div className="aspect-[4/3] rounded-md overflow-hidden bg-surface-container shadow-sm">
                                <PropertyImage
                                    propId={property.id}
                                    propName={img.caption || img.image}
                                    src={img.image}
                                    className="h-full w-full object-cover brightness-[0.96] transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>
                            {img.caption && (
                                <figcaption className="text-sm font-medium text-on-surface">
                                    {img.caption}
                                </figcaption>
                            )}
                        </figure>
                    ))}
                </div>
            )}

            {details.length > 0 && (
                <div
                    className={`grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6 ${images.length > 0 ? "pt-7 border-t border-outline-variant/40" : ""}`}
                >
                    {details.map((d) => (
                        <div key={d.id ?? d.name} className="flex gap-3.5">
                            <DynamicIcon
                                name={toKebabIcon(d.icon) as any}
                                className="shrink-0 mt-0.5 size-5 text-sbr-blue"
                            />
                            <div className="flex flex-col gap-0.5">
                                <span className="text-base font-bold text-on-surface">
                                    {d.name}
                                </span>
                                {d.value && (
                                    <span className="text-sm text-on-surface-variant">
                                        {d.value}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function AllDetailsDialog({
    property,
    details,
    namedImages,
}: {
    property: TProperty;
    details: TProperty["details"];
    namedImages: TProperty["namedImages"];
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 mt-7 text-sm font-semibold text-sbr-blue hover:text-sbr-blue-light transition-colors"
                >
                    Ver todos los detalles
                    <ArrowRight className="size-4" />
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-extrabold tracking-tight">
                        Detalles de la propiedad
                    </DialogTitle>
                    <DialogDescription>
                        Todas las características e imágenes registradas.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-10 pt-2">
                    {DETAIL_CATEGORIES.map((c) => {
                        const catImages = namedImages.filter((n) => n.category === c.key);
                        const catDetails = details.filter((d) => d.category === c.key);
                        if (catImages.length === 0 && catDetails.length === 0) return null;
                        return (
                            <div key={c.key} className="space-y-5">
                                <h3 className="text-sm font-bold uppercase tracking-wide text-sbr-blue">
                                    {c.label}
                                </h3>
                                <CategoryPane
                                    property={property}
                                    images={catImages}
                                    details={catDetails}
                                />
                            </div>
                        );
                    })}
                </div>
            </DialogContent>
        </Dialog>
    );
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
    );
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
                            <DynamicIcon
                                name={amty.icon as unknown as any}
                                className="shrink-0 grow-0 size-8"
                            />
                            <span className="text-sm font-semibold">{amty.title}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </section>
    );
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
                toast.success("Tu solicitud fue enviada. Te contactaremos pronto.", {
                    closeButton: true,
                });
                form.reset();
            } catch (err) {
                toast.error(
                    err instanceof Error
                        ? err.message
                        : "Ocurrió un error al enviar la solicitud.",
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
            ></motion.div>
            <div className="bg-surface-container-lowest rounded-lg p-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border-2 border-sbr-green/40 transition-shadow hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
                <div className="mb-8">
                    <h2 className="text-2xl font-sans font-extrabold text-on-surface">
                        Contactanos
                    </h2>
                    <p className="text-sm text-on-surface-variant mt-2">
                        Si deseas conocer la propiedad o recibir asesoria de un agente SIBRA,
                        mandanos tus datos.
                    </p>
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
                                <label
                                    htmlFor={field.name}
                                    className="block text-tiny font-sans font-bold text-primary uppercase tracking-[0.1em] ml-1"
                                >
                                    Nombre
                                </label>
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
                                {field.state.meta.isTouched &&
                                field.state.meta.errors.length > 0 ? (
                                    <p className="text-xs text-destructive ml-1 mt-1">
                                        {field.state.meta.errors
                                            .map((err) => err?.message)
                                            .filter(Boolean)
                                            .join(", ")}
                                    </p>
                                ) : null}
                            </div>
                        )}
                    />
                    <form.Field
                        name="phone"
                        children={(field) => (
                            <div className="space-y-1">
                                <label
                                    htmlFor={field.name}
                                    className="block text-tiny font-sans font-bold text-primary uppercase tracking-[0.1em] ml-1"
                                >
                                    Teléfono
                                </label>
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
                                {field.state.meta.isTouched &&
                                field.state.meta.errors.length > 0 ? (
                                    <p className="text-xs text-destructive ml-1 mt-1">
                                        {field.state.meta.errors
                                            .map((err) => err?.message)
                                            .filter(Boolean)
                                            .join(", ")}
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
                                    <label
                                        htmlFor={field.name}
                                        className="text-xs text-on-surface-variant leading-snug"
                                    >
                                        Acepto que se me contacte a través de Whatsapp o llamada
                                        telefónica.
                                    </label>
                                </div>
                                {field.state.meta.isTouched &&
                                field.state.meta.errors.length > 0 ? (
                                    <p className="text-xs text-destructive ml-1">
                                        {field.state.meta.errors
                                            .map((err) => err?.message)
                                            .filter(Boolean)
                                            .join(", ")}
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
                                    {isSubmitting || propInfoMut.isPending
                                        ? "Enviando..."
                                        : "Solicitar Contacto"}
                                </Button>
                            </motion.div>
                        )}
                    />
                </form>
            </div>
        </section>
    );
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
    );
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
    );
}

function MobileLayout({ property }: { property: TProperty }) {
    return (
        <div className="md:hidden">
            <HeroSection property={property} />
            <TitlePriceBlock property={property} />
            <PropertyDetailsSection property={property} />
            <ArchitecturalVision property={property} />
            {property.amenities?.length > 0 && <AmenitiesGrid property={property} />}
            <InquiryForm property={property} />
            <QuoteFormSection property={property} />
            <LocationContext property={property} />
        </div>
    );
}

function BigScreenLayout({ property }: { property: TProperty }) {
    return (
        <div className="hidden md:block md:max-w-screen-xl md:mx-auto md:px-6 lg:px-10 md:pt-6">
            <div className="md:grid md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_400px] md:gap-6 lg:gap-8 md:items-start">
                {/* Left column: hero image, description, amenities, map */}
                <div className="md:space-y-6">
                    <HeroSection property={property} />
                    <PropertyDetailsSection property={property} />
                    <ArchitecturalVision property={property} />
                    {property.amenities?.length > 0 && <AmenitiesGrid property={property} />}
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
    );
}
