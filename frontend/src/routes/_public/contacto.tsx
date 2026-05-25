import { createFileRoute } from "@tanstack/react-router";
import { useEffect, Suspense } from "react";
import { motion } from "motion/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/stores/uiStore";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConnectIcon } from "@/components/icons/connect";
import { InstagramIcon } from "@/components/icons/instagram";
import { FacebookIcon } from "@/components/icons/facebook";
import { Clock, MapPin, Phone, PhoneIcon } from "lucide-react";
import { WhatsappIcon } from "@/components/icons/whatsapp";
import { InfoForm } from "@/components/contact/InfoForm";
import { getAgentsOpts } from "@/queries/users";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { TPublicUser } from "@/queries/type";
import { Image } from "@/components/Image";

export const Route = createFileRoute("/_public/contacto")({
    component: RouteComponent,
    head: () => ({
        meta: [{
            title: "Contacto | Sibra Inmobiliaria",
        }],
        links: [{
            rel: "preload",
            href: "/agent_showcase_2.webp",
            as: "image",
            fetchPriority: "high",
        }],
    }),
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(getAgentsOpts());
    },
});

function RouteComponent() {
    const { setHeaderComplementProps, setHeaderFloating } = useUIStore();
    useEffect(() => {
        setHeaderFloating(true);
        setHeaderComplementProps({ complementType: "cta" });
    }, []);

    return (
        <main>
            <section className="relative z-0 py-16 sm:py-24 px-6 sm:px-12 lg:px-20 xl:pt-32 xl:pb-52">
                <div className="absolute z-0 inset-0 w-full h-full bg-[url('/agent_showcase_2.webp')] bg-center bg-fixed bg-size-[auto_100%] brightness-70">
                </div>
                <div className="absolute z-0 inset-0 bg-surface-bright/5 backdrop-blur-xs"></div>
                <div className="contents lg:flex lg:gap-16 lg:max-w-7xl mx-auto">
                    <div className="relative z-10 max-w-2xl xl:max-w-none xl:flex-1 xl:basis-3/5 text-white pt-6 mb-16 mx-auto xl:mx-0">
                        <motion.span
                            className="uppercase tracking-[0.1em] text-xs font-semibold block mb-2"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                        >Ponte en contacto</motion.span>
                        <motion.h1
                            className="text-6xl md:text-7xl font-headline font-extrabold tracking-tighter leading-[1.1] text-on-background lg:mb-6"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                        >
                            Hablemos de tu proxima <span className="text-sbr-blue">inversión.</span>
                        </motion.h1>
                        <p className="hidden xl:block text-lg text-current/80 font-medium max-w-md leading-relaxed text-shadow-lg">
                            Nuestro equipo de expertos está listo para convertir tu visión en la inversión de tu vida.
                        </p>
                    </div>
                    <motion.div
                        className="relative z-10 xl:flex-1 xl:basis-2/5"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                    >
                        <div className="relative z-10 max-w-2xl mx-auto">
                            <InfoForm contactType="informacion" />
                        </div>
                        <div className="relative z-0 lg:hidden">
                            <ContactDataCard />
                        </div>
                    </motion.div>
                </div>
            </section>
            <section className="relative z-0 bg-surface-container-low px-6 sm:px-12 lg:px-20 py-12 md:py-16 lg:py-24">
                <div className="max-w-7xl mx-auto space-y-8 lg:space-y-12">
                    <div className="space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-medium">Encuentranos</h2>
                        <p className="text-sm text-current/60">
                            Puedes encontrar nuestras oficinas en los siguientes domicilios:
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row lg:grid lg:grid-cols-2 lg:grid-rows-2 gap-6 lg:gap-12 *:basis-1/2 *:grow-0" >
                        <motion.div
                            className="hidden lg:block lg:row-span-2 *:bg-sbr-blue"
                            initial={{ y: 20, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true, amount: 0.5 }}
                            transition={{ duration: 0.7 }}
                        >
                            <ContactDataCard />
                        </motion.div>
                        {
                            offices.map((office, idx) => (
                                <motion.div
                                    className="h-full *:h-full"
                                    initial={{ y: 20, opacity: 0 }}
                                    whileInView={{ y: 0, opacity: 1 }}
                                    viewport={{ once: true, amount: 0.5 }}
                                    transition={{ duration: 0.7, delay: 0.05 * (idx + 1) }}
                                    key={office.title}
                                >
                                    <OfficeCard office={office} />
                                </motion.div>
                            ))
                        }
                    </div>
                </div>
            </section>
            <ErrorBoundary fallback={<AgentsSectionError />}>
                <Suspense fallback={<AgentsSectionSkeleton />}>
                    <AgentsSection />
                </Suspense>
            </ErrorBoundary>
            <section className="relative z-0 bg-gray-200 px-6 lg:px-20 py-12 sm:py-6 lg:py-8 text-current/80">
                <div className="text-center mb-4">
                    <ConnectIcon className="text-current/90 size-10 mx-auto" />
                </div>
                <h2 className="text-2xl font-medium text-center">Conecta con nosotros</h2>
                <div className="flex gap-4 lg:gap-8 items-center justify-center pt-4">
                    <a
                        href="https://www.instagram.com/sibra_mx/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <InstagramIcon className="size-8" />
                    </a>
                    <a
                        href="https://www.facebook.com/sibramx"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <FacebookIcon className="size-8" />
                    </a>
                </div>
            </section>
        </main>
    );
}

function ContactDataCard() {
    return (
        <div className="max-w-2xl text-gray-50 text-center bg-primary-container/40 backdrop-blur rounded-lg space-y-4 p-6 pt-8 sm:px-12 sm:py-16 mx-auto -mt-2">
            <div className="space-y-1">
                <h2 className="text-4xl sm:text-5xl font-semibold">Comunicate</h2>
                <p className="font-light text-current/80">Estamos a tus ordenes.</p>
            </div>
            <div className="space-y-1">
                <h3 className="text-current/80">
                    Servicio al cliente en los horarios:
                </h3>
                <div className="sm:w-fit grid grid-cols-[auto_1fr] gap-3 sm:gap-x-12 pt-4 px-8 mx-auto">
                    <div className="col-span-full grid grid-cols-subgrid">
                        <div className="col-start-1 flex flex-col items-center gap-1">
                            <div className="text-xs sm:text-base font-semibold">Lun-Vie</div>
                            <Clock className="size-6 sm:size-8" />
                        </div>
                        <div className="col-start-2 xs:text-xl sm:text-2xl font-medium ml-auto mt-auto">
                            10:00 am - 07:00 pm
                        </div>
                    </div>
                    <div className="col-span-full grid grid-cols-subgrid">
                        <div className="col-start-1 flex flex-col items-center gap-1">
                            <div className="text-xs sm:text-base font-semibold">Sáb</div>
                            <Clock className="size-6 sm:size-8" />
                        </div>
                        <div className="col-start-2 xs:text-xl sm:text-2xl font-medium ml-auto mt-auto">
                            10:00 am - 02:00 pm
                        </div>
                    </div>
                </div>
                <h3 className="sm:text-xl text-current/80 mt-6">
                    Llamanos o manda Whatsapp a los números:
                </h3>
                <div className="sm:w-fit grid grid-cols-[auto_1fr] gap-3 sm:gap-x-12 pt-4 px-8 mx-auto">
                    <div className="col-span-full grid grid-cols-subgrid">
                        <div className="col-start-1 flex flex-col items-center gap-1">
                            <div className="text-xs sm:text-base font-semibold">Mazatlán</div>
                            <Phone className="size-6 sm:size-8" />
                        </div>
                        <div className="col-start-2 xs:text-xl sm:text-2xl ml-4 mr-auto mt-auto">
                            (669) 112-9742
                        </div>
                    </div>
                    <div className="col-span-full grid grid-cols-subgrid">
                        <div className="col-start-1 flex flex-col items-center gap-1">
                            <div className="text-xs sm:text-base font-semibold">Durango</div>
                            <Phone className="size-6 sm:size-8" />
                        </div>
                        <div className="col-start-2 xs:text-xl sm:text-2xl ml-4 mr-auto mt-auto">
                            (618) 194-1145
                        </div>
                    </div>
                </div>
                <Button className="w-4/5 xl:h-auto xl:text-base xl:py-2 bg-sbr-green hover:bg-gray-50 active:bg-gray-50 hover:text-sbr-green active:text-sbr-green mt-12 xl:mx-auto" asChild>
                    <a href="https://wa.me/6181941145?text=¡Hola! Me gustaría hablar con un agente SIBRA.">
                        Enviar un Whatsapp
                    </a>
                </Button>
            </div>
        </div>
    );
}

function OfficeCard({ office }: { office: typeof offices[0] }) {
    return (
        <Card className="pt-0 rounded-xl overflow-hidden">
            <CardHeader className="block h-full p-0">
                <iframe
                    src={office.mapSrc}
                    width="400"
                    height="300"
                    className="w-full h-full object-cover border-0 rounded-t"
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-6">
                <div className="flex-1 space-y-1">
                    <h3 className="text-lg lg:text-xl tracking-tighter text-on-surface/60">{office.title}</h3>
                    <p className="sm:text-lg font-medium text-current">{office.address}</p>
                </div>
                <div className="shrink grow-0 my-auto">
                    <Button className="bg-sbr-blue/20 active:scale-95" size="icon" variant="ghost">
                        <MapPin className="text-sbr-blue size-5" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

const offices = [
    {
        mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3644.8457070902837!2d-104.66324402462155!3d24.001224979100773!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x869bc7ffdb768fa5%3A0x2ab21e09ae62252f!2sC%C3%A1ncer%20132%2C%20Sahop%2C%2034190%20Durango%2C%20Dgo.!5e0!3m2!1sen!2smx!4v1757905868906!5m2!1sen!2smx",
        title: "Matriz Durango",
        address: "C. Cancer 132. Fracc. Sahop, 34190 Durango, Dgo.",
    },
    {
        mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3666.245102084866!2d-106.42603622464132!3d23.234166308398777!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x869f536e84530b25%3A0x35c1072887e44762!2sAv.%20Ej%C3%A9rcito%20Mexicano%201102B%2C%20Sembradores%20de%20la%20Amistad%2C%2082146%20Mazatl%C3%A1n%2C%20Sin.!5e0!3m2!1sen!2smx!4v1757906268437!5m2!1sen!2smx",
        title: "Oficina Mazatlán",
        address: "Av. Ejercito Mexicano 1102B, Sembradores de la Amistad, 82146 Mazatlán, Sin.",
    }
]

function AgentsSectionSkeleton() {
    return (
        <section className="bg-surface-container px-6 md:px-12 lg:px-20 py-12 md:py-16 lg:py-24">
            <div className="max-w-7xl space-y-8 mx-auto">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64 rounded-md" />
                    <Skeleton className="h-4 w-80 rounded-md" />
                </div>
                <div className="grid lg:flex grid-cols-2 gap-12">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center justify-center gap-2">
                            <Skeleton className="size-32 rounded-xl" />
                            <Skeleton className="h-4 w-24 rounded-md" />
                            <div className="flex gap-3">
                                <Skeleton className="size-4 rounded-full" />
                                <Skeleton className="size-4 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function AgentsSectionError() {
    return (
        <section className="bg-surface-container px-6 md:px-12 lg:px-20 py-12 md:py-16 lg:py-24">
            <div className="max-w-7xl space-y-8 mx-auto">
                <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-medium">Habla con un experto</h2>
                </div>
                <p className="text-sm text-current/60">
                    Pronto agregaremos el listado de nuestros agentes.
                </p>
            </div>
        </section>
    );
}

function AgentsSection() {
    const { data } = useSuspenseQuery(getAgentsOpts());

    return (
        <section className="bg-surface-container px-6 md:px-12 lg:px-20 py-12 md:py-16 lg:py-24">
            <div className="max-w-7xl space-y-8 mx-auto">
                <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-medium">Habla con un experto</h2>
                    <p className="text-sm text-current/60">Contamos con agentes dedicados a tus necesidades.</p>
                </div>
                <div className="grid lg:flex grid-cols-2 gap-12">
                    {
                        data.users.map((agent, idx) => (
                            <AgentCard key={idx} agent={agent} />
                        ))
                    }
                </div>
            </div>
        </section>
    );
}

function AgentCard({ agent }: { agent: TPublicUser }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2">
            <div className="shrink-0 size-32 aspect-square rounded-xl overflow-hidden">
                <Image
                    className="w-auto h-full object-cover m-auto"
                    src={"/uploads/" + agent.img}
                />
            </div>
            <div className="text-center space-y-1">
                <p className="font-medium">{agent.name}</p>
                <ul className="flex items-center justify-center gap-3">
                    <li><a href={"https://wa.me/" + agent.phone + "?text=¡Hola! Me gustaría obtener más información de Conquistadores."}><WhatsappIcon className="text-current/60 hover:text-sbr-green active:text-sbr-green size-4 scale-100 hover:scale-105 active:scale-95 transition-[color,transform,scale]" /></a></li>
                    <li><a href={"tel:" + agent.phone}><PhoneIcon className="text-current/60 hover:text-sbr-blue active:text-sbr-blue size-4 scale-100 hover:scale-105 active:scale-95 transition-[color,transform,scale]" /></a></li>
                </ul>
            </div>
        </div>
    );
}
