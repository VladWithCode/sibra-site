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
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormatMetric, FormatMoney } from "@/lib/format";
import { MapsAPIProvider, PropertyLocationMap } from "@/maps";
import { getPropertyBySlugOpts } from "@/queries/properties";
import type { TProperty } from "@/queries/type";
import { useUIStore } from "@/stores/uiStore";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bath, Bed, Home, XIcon, ZoomIn } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

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
            <section className="relative w-full aspect-[4/5] overflow-hidden bg-surface-container">
                <motion.div
                    className="w-full h-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <DialogTrigger className="w-full h-full p-0" asChild>
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
                        <span className="text-[10px] font-sans font-bold tracking-widest text-primary uppercase">1 / {property.imgs.length} Fotos</span>
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
                className="w-screen max-w-screen flex flex-col bg-transparent border-none p-0 shadow-none"
            >
                <DialogClose className="fixed top-4 right-2">
                    <XIcon className="text-primary-foreground stroke-3" />
                </DialogClose>
                <DialogTitle className="sr-only">Galería de fotos: {property.address}</DialogTitle>
                <Carousel setApi={setApi} className="w-full mt-auto" opts={{ loop: true }}>
                    <CarouselContent>
                        {property.imgs.map((img, i) => (
                            <CarouselItem key={`${img}-${i}`}>
                                <div className="flex items-center justify-center w-full aspect-[4/5] sm:aspect-video">
                                    <PropertyImage
                                        className="max-w-full max-h-full object-contain"
                                        propId={property.id}
                                        propName={property.address}
                                        src={img}
                                    />
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="left-2 sm:-left-12 bg-white/90" />
                    <CarouselNext className="right-2 sm:-right-12 bg-white/90" />
                </Carousel>
                <p className="text-center text-sm font-sans font-bold tracking-widest text-white/80 uppercase">
                    {current} / {property.imgs.length} Fotos
                </p>
                <div className="flex justify-between gap-3 text-on-primary mt-auto p-4">
                    <Button variant="outline" className="flex-1 bg-surface-container-low/30 backdrop-blur-md">
                        Solicitar Precalificación
                    </Button>
                    <Button className="flex-1">
                        Agendar Cita
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function TitlePriceBlock({ property }: { property: TProperty }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="px-6 py-8 bg-surface"
        >
            <div className="flex flex-col gap-2">
                <span className="text-primary font-sans text-[11px] uppercase tracking-[0.2em] font-bold">{property.state}, {property.city}</span>
                <h1 className="text-3xl font-sans font-extrabold text-on-surface tracking-tight leading-tight">
                    {property.address} {property.nbHood}, {property.zip}
                </h1>
                <p className="text-2xl font-sans font-bold text-primary-container mt-2">{FormatMoney(property.price)}</p>
            </div>
            <div className="grid grid-cols-4 gap-3 py-6 mt-8 border-y border-outline-variant/15 text-on-surface/60">
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
        </motion.section>
    )
}

function ArchitecturalVision({ property }: { property: TProperty }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="px-6 py-10 bg-surface-container-low"
        >
            <div className="space-y-6">
                <h2 className="text-xl font-sans font-bold text-on-surface flex items-center gap-3">
                    Vision Arquitectónica
                    <div className="h-px flex-1 bg-outline-variant/20" />
                </h2>
                <div className="space-y-4">
                    <p className="text-on-surface-variant leading-relaxed font-sans">
                        {property.description}
                    </p>
                </div>
            </div>
        </motion.section>
    )
}

function AmenitiesGrid({ property }: { property: TProperty }) {
    const feats = Object.entries(property.features);

    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="px-6 py-10 bg-surface"
        >
            <h2 className="text-xl font-sans font-bold text-on-surface mb-8">Características y Amenidades</h2>
            <div className="grid grid-cols-2 gap-4">
                {feats.map((feat, i) => (
                    <motion.div
                        key={feat[0]}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                        className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/10"
                    >
                        {/* <amenity.icon className="text-primary size-5" /> */}
                        <span className="text-sm font-semibold">{feat[0]}</span>
                    </motion.div>
                ))}
            </div>
        </motion.section>
    )
}

function SpaceOrchestration() {
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="px-6 py-10 bg-surface-container-low"
        >
            <h2 className="text-xl font-sans font-bold text-on-surface mb-6">Space Orchestration</h2>
            <motion.div
                whileTap={{ scale: 1.05 }}
                transition={{ duration: 0.5 }}
                className="relative group rounded-2xl overflow-hidden bg-white p-4 shadow-sm border border-outline-variant/10"
            >
                <img
                    alt="Property Blueprint"
                    className="w-full h-auto"
                    src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=800"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                    <ZoomIn className="text-white size-10" />
                </div>
            </motion.div>
            <p className="text-center text-[10px] text-on-surface-variant font-sans mt-4 uppercase tracking-widest">Tap to expand technical floorplan</p>
        </motion.section>
    )
}

function InquiryForm({ property }: { property: TProperty }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="px-6 py-12 bg-surface"
        >
            <div className="bg-surface-container-lowest rounded-lg p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-outline-variant/15 transition-shadow hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)]">
                <div className="mb-8">
                    <h2 className="text-2xl font-sans font-extrabold text-on-surface">Contactanos</h2>
                    <p className="text-sm text-on-surface-variant mt-2">Si deseas conocer la propiedad o recibir asesoria de un agente SIBRA, mandanos tus datos.</p>
                </div>
                <form className="space-y-6">
                    <div className="space-y-1">
                        <label className="block text-[10px] font-sans font-bold text-primary uppercase tracking-[0.1em] ml-1">Nombre</label>
                        <Input
                            className="w-full px-4 py-4 bg-surface-container-high rounded border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-outline/50"
                            placeholder="Martin Felix"
                            type="text"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-[10px] font-sans font-bold text-primary uppercase tracking-[0.1em] ml-1">Phone Number</label>
                        <Input
                            className="w-full px-4 py-4 bg-surface-container-high rounded border-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all placeholder:text-outline/50"
                            placeholder="6181594681"
                            type="tel"
                        />
                    </div>
                    <motion.div
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            className="w-full bg-gradient-to-r from-sbr-blue to-primary-container text-primary-foreground font-sans font-bold rounded shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                        >
                            Solicitar Contacto
                        </Button>
                    </motion.div>
                </form>
            </div>
        </motion.section>
    )
}

function LocationContext({ property }: { property: TProperty }) {
    return (
        <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="px-6 py-10 bg-surface-container-low mb-12"
        >
            <h2 className="text-xl font-sans font-bold text-on-surface mb-6">Ubicación</h2>
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-200 relative group">
                <MapsAPIProvider>
                    <PropertyLocationMap property={property} />
                </MapsAPIProvider>
            </div>
            {/* <div className="mt-6 flex flex-col gap-4"> */}
            {/*     <div className="flex items-start gap-4"> */}
            {/*         <motion.div */}
            {/*             animate={{ y: [0, -5, 0] }} */}
            {/*             transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} */}
            {/*         > */}
            {/*             <MapPin className="text-primary size-5 mt-1" /> */}
            {/*         </motion.div> */}
            {/*         <div> */}
            {/*             <p className="font-bold text-on-surface">Paseo de la Reforma, CDMX</p> */}
            {/*             <p className="text-sm text-on-surface-variant">Exclusive Residential Sector</p> */}
            {/*         </div> */}
            {/*     </div> */}
            {/* </div> */}
        </motion.section>
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
        <main>
            <HeroSection property={property} />
            <TitlePriceBlock property={property} />
            <ArchitecturalVision property={property} />

            {property.features?.length > 0 && <AmenitiesGrid property={property} />}

            {/* <SpaceOrchestration /> */}
            <InquiryForm property={property} />
            <LocationContext property={property} />
            <FloatingCTA />
        </main>
    )
}

