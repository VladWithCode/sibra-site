import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { SecondaryLinkButton } from "@/components/sibra_buttons";
import { HomeIcon, LoanIcon, ProjectsIcon, SellHomeIcon } from "@/components/icons/icons";
import { getFeaturedPropertiesOpts } from "@/queries/properties";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useUIStore } from "@/stores/uiStore";
import { useEffect } from "react";
import { HomePropertyCard } from "@/components/properties/HomePropertyCard";
import { ArrowRight, Check } from "lucide-react";
import { motion } from "motion/react";
import type { TProperty } from "@/queries/type";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_public/")({
    component: RouteComponent,
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(getFeaturedPropertiesOpts);
    },
    head: () => ({
        links: [{
            rel: "preload",
            href: "/hero.webp",
            as: "image",
            fetchPriority: "high",
        }],
    }),
});

function HeroSection() {
    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();
    useEffect(() => {
        setHeaderFloating(true);
        setHeaderComplementProps({ complementType: "none" });
    }, []);

    return (
        <section className="relative z-0 md:h-auto">
            <div className="absolute inset-0 z-0">
                <img
                    className="h-full max-w-full md:w-full object-cover object-center brightness-85"
                    src="/hero.webp"
                    alt=""
                />
            </div>
            <div className="relative z-10 h-full bg-linear-to-b from-gray-700/80 to-45% sm:to-60% to-gray-700/50 p-6 pt-90 sm:p-12 sm:pt-90 xl:pt-72 xl:px-20">
                <div className="h-full flex flex-col justify-end max-w-6xl space-y-6 md:space-y-8 xl:space-y-16 mx-auto">
                    <h1 className="text-5xl md:text-6xl text-gray-50 tracking-tight leading-14 xl:leading-18">
                        <motion.span
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="inline-block"
                        >Casas en todo</motion.span>
                        <br />
                        <motion.span
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="inline-block text-7xl md:text-8xl font-semibold"
                        >Durango</motion.span>
                    </h1>
                    <div className="flex items-center gap-4 lg:gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex-1 xl:flex-none"
                        >
                            <Button className="w-full h-auto bg-sbr-green font-bold xl:text-base xl:px-8 py-3" asChild>
                                <Link to="/propiedades">Ver Propiedades</Link>
                            </Button>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="flex-1 xl:flex-none"
                        >
                            <Button className="w-full h-auto bg-sbr-blue-light xl:text-base text-on-primary xl:px-8 py-3" asChild>
                                <Link to="/contacto">Vende tu casa</Link>
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FeaturedListings({ properties }: { properties: TProperty[]; }) {
    return (
        <section className="py-32 px-6 md:px-12 bg-surface-container-low">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
                    <div>
                        <span className="text-label-md text-primary mb-3 block">Oportunidades únicas</span>
                        <h2 className="text-headline-lg">Últimas propiedades en oferta</h2>
                    </div>
                    <Link to="/propiedades" className="flex items-center gap-1 text-sm text-sbr-blue-dark leading-0">
                        <span>Ver todas las propiedades</span>
                        <ArrowRight className="size-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Main Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.5 }}
                        className="md:col-span-7 relative overflow-hidden group h-[600px] shadow-2xl"
                    >
                        <HomePropertyCard propData={properties[0]} />
                    </motion.div>

                    {/* Side Cards */}
                    <div className="md:col-span-5 flex flex-col justify-between gap-6">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.5 }}
                            className="relative overflow-hidden group h-[284px] shadow-xl"
                        >
                            <HomePropertyCard propData={properties[1]} />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0, transitionDuration: 0.5 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="relative overflow-hidden group h-[284px] shadow-xl"
                        >
                            <HomePropertyCard propData={properties[2]} />
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function AboutSection() {
    return (
        <section className="py-40 px-6 md:px-12 bg-surface overflow-hidden">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-24">
                <div className="md:w-1/2 relative">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative z-10 rounded-lg overflow-hidden shadow-[0_48px_100px_-24px_rgba(0,0,0,0.3)]"
                    >
                        <img
                            src="/masquemetroscuadrados.jpg"
                            alt="Our Team"
                            referrerPolicy="no-referrer" />
                    </motion.div>
                    <div className="absolute -bottom-10 -right-10 glass p-10 rounded-xl z-20 shadow-2xl hidden md:block">
                        <p className="text-5xl font-headline font-extrabold text-primary mb-1">15+</p>
                        <p className="text-label-md text-on-surface-variant">Años de excelencia</p>
                    </div>
                </div>

                <div className="md:w-1/2">
                    <span className="text-label-md text-primary mb-6 block">LEGADO SIBRA</span>
                    <h2 className="text-display-md mb-10">
                        Más que metros cuadrados.<br />
                        <span className="text-outline-variant">Espacios que elevan tu estilo de vida.</span>
                    </h2>
                    <p className="text-on-surface-variant text-xl leading-relaxed mb-12">
                        En sibra.mx entendemos que una propiedad no es solo una inversión:
                        es el escenario donde se construye tu vida.
                        Combinamos análisis profundo del mercado con una curaduría estética
                        excepcional para ofrecerte espacios únicos,
                        pensados para destacar, inspirar y trascender.
                    </p>

                    <div className="space-y-6 mb-12">
                        {[
                            "Estrategias de adquisición totalmente personalizadas",
                            "Acceso exclusivo a oportunidades fuera del mercado",
                            "Acompañamiento integral de principio a fin"
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Check size={14} className="text-primary" />
                                </div>
                                <span className="font-headline font-bold text-lg">{item}</span>
                            </div>
                        ))}
                    </div>

                    <Button
                        className="bg-on-surface text-white font-headline font-bold hover:bg-slate-800  transition-all shadow-xl active:scale-95"
                        asChild
                    >
                        <Link to="/nosotros">Conoce nuestra historia</Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}

const serviceList = [
    {
        icon: ProjectsIcon,
        title: "Desarrollos",
        description: "Encuentra un lugar para tu familia o conoces los desarrollos que el equipo de SIBRA tiene en la ciudad.",
        link: "/proyectos",
    },
    {
        icon: HomeIcon,
        title: "Comprar",
        description: "¿Buscas una casa, apartamento o alguna vivienda para ti y tu familia? ¡En SIBRA tenemos las mejores opciones para que encuentres la casa de tus sueños!",
        link: "/propiedades",
    },
    {
        icon: SellHomeIcon,
        title: "Vender",
        description: "Si lo que buscas es vender tu propiedad, SIBRA es tu solución inteligente. Con nuestra plataforma, podrás vender tu casa, apartamento o vivienda de manera rápida y sencilla.",
        link: "/vende-tu-casa",
    },
    {
        icon: LoanIcon,
        title: "Precalificaciones",
        description: "En SIBRA, estamos comprometidos en ayudarte a encontrar la vivienda de tus sueños. Por eso, te asesoramos y apoyamos en todo el proceso para financiar tu casa.",
        link: "/precalificaciones",
    },
];

function ServiceSection() {
    return (
        <section className="relative z-0 bg-surface-container-low px-6 py-12 xl:py-32 2xl:py-56 space-y-6">
            <h2 className="sr-only">Nuestros servicios</h2>
            <div className="max-w-8xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-auto gap-6 xl:px-6 mx-auto">
                {
                    serviceList.map((service, i) => (
                        <motion.div
                            className="max-w-sm mx-auto"
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.5, delay: 0.1 * i }}
                            key={service.title}
                        >
                            <Card className="h-full">
                                <CardContent className="h-full flex flex-col gap-y-4">
                                    <div className="basis-2/5 grow-0 flex items-center justify-center w-40 aspect-square text-sbr-green rounded-full mx-auto">
                                        <service.icon className="size-40 xl:size-32" />
                                    </div>
                                    <div className="basis-full space-y-2.5">
                                        <h3 className="text-2xl lg:text-3xl xl:text-2xl font-bold text-center">{service.title}</h3>
                                        <p className="xl:text-sm text-current/60 tracking-tight leading-relaxed px-6">{service.description}</p>
                                    </div>
                                    <div className="flex flex-1 mt-auto justify-center">
                                        <SecondaryLinkButton label="Más Información" to={service.link} />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))
                }
            </div>
        </section>
    );
}

function QuoteSection() {
    return (
        <section className="relative z-0">
            <div className="absolute inset-0 z-0">
                <img
                    className="w-full h-full object-cover object-center"
                    src="/sample.webp"
                    alt=""
                />
            </div>
            <div className="relative z-10 text-gray-100 text-center bg-linear-to-b from-sbr-blue-dark/90 to-sbr-blue/90 px-6 sm:px-8 pt-24 sm:pt-32 xl:pt-64 py-18 sm:py-24 xl:py-32 space-y-1 sm:space-y-3 xl:space-y-6">
                <h2 className="relative text-3xl sm:text-4xl xl:text-5xl font-semibold">
                    <span className="absolute -top-12 xl:-top-16 left-1/2 -translate-x-1/2 text-8xl xl:text-9xl text-red-600">
                        "
                    </span>
                    <span>Tu Solución Inteligente en Bienes Raíces"</span>
                </h2>
                <p className="text-xl sm:text-2xl xl:text-3xl font-medium">SIBRA</p>
            </div>
        </section>
    );
}

function CTASection() {
    return (
        <section className="bg-sbr-blue-dark py-24 px-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
                <img
                    className="w-full h-full object-cover"
                    data-alt="subtle abstract architectural pattern with repeating geometric lines and curves"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTc0pqjrHSm1h_dmQow6HbIgH8UGJSHoP5gMq_W-oJlTHofFh0j_PFwh-RCkvsrKg1pfZyu8pmzIE-qr1sr6zMEfdn3OUpmWeW-sLo_qZPF5bB7RZXoB_1vu8RPxgh9ZKe9Wb6HT9KeDZQ61Y9L4qDOQx1y0PQdjppoLdGrS2VZcYjRuSzotfXYw-0DLm3_-uOfPmYgR7uN9FmTKYpYMVKkHe0DPHj4pXb--MssZhjvOlH_wK6bv1B-W45iPMzksohworxg0zGQ4Y"
                />
            </div>
            <div className="max-w-5xl mx-auto text-center relative z-10">
                <h2 className="font-headline text-4xl md:text-5xl font-extrabold mb-6 tracking-tighter">¿Preparado para enamorarte a primera vista… de tu próxima propiedad?</h2>
                <p className="text-primary-fixed text-lg mb-12 max-w-2xl mx-auto">
                    Únete a nuestra red privada y sé el primero en descubrir las oportunidades más exclusivas de México, antes de que anyone más pueda acceder a ellas.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link
                        className="bg-white text-primary px-10 py-4 rounded-lg font-headline font-bold hover:bg-primary-fixed transition-all"
                        to="/propiedades"
                    >
                        Explorar propiedades
                    </Link>
                    <Link
                        className="border border-white/30 text-white px-10 py-4 rounded-lg font-headline font-bold hover:bg-white/10 transition-all"
                        to="/contacto"
                    >
                        Contáctar a un agente
                    </Link>
                </div>
            </div>
        </section>
    );
}

function RouteComponent() {
    const { data: properties } = useSuspenseQuery(getFeaturedPropertiesOpts);

    return (
        <main>
            <HeroSection />
            <FeaturedListings properties={properties} />
            <AboutSection />
            <ServiceSection />
            <CTASection />
            <QuoteSection />
        </main>
    );
}
