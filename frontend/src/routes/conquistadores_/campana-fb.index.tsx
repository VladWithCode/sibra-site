import { ConqsFooterQuoteForm, ConqsQuoteForm } from '@/components/contact/ConqsQuoteForm';
import { PublicLayout } from '@/components/layout/publicLayout'
import { Card, CardContent } from '@/components/ui/card';
import { useUIStore } from '@/stores/uiStore'
import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2, Clock, MapPin, Phone } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { Button } from '@/components/ui/button';
import { animateSection } from './-animations';

export const Route = createFileRoute('/conquistadores_/campana-fb/')({
    component: RouteComponent,
    head: () => ({
        meta: [
            { title: "Conquistadores II" },
            { name: "description", content: "Conoce el desarrollo Conquistadores II que SIBRA Inmobiliaria ha hecho en Durango." },
        ],
        links: [
            {
                rel: "stylesheet",
                href: "/conquistadores.css",
            }
        ],
    }),
})

function RouteComponent() {
    const { setHeaderFloating, setHeaderComplement } = useUIStore();
    const mainContentRef = useRef<HTMLDivElement>(null);
    const { contextSafe } = useGSAP({ scope: mainContentRef });
    const safeAnimateSection = contextSafe(animateSection);

    useLayoutEffect(() => {
        setHeaderFloating(true);
        setHeaderComplement("none");
    }, []);

    useLayoutEffect(() => {
        if (!mainContentRef.current) return;

        const obsv = new IntersectionObserver((ents, obsv) => {
            for (const ent of ents) {
                if (ent.isIntersecting) {
                    safeAnimateSection(ent.target as HTMLElement, obsv);
                    obsv.unobserve(ent.target);
                }
            }
        }, { threshold: 0.35 });

        mainContentRef.current.querySelectorAll("section").forEach((el) => {
            obsv.observe(el);
        });

        return () => {
            obsv.disconnect();
        };
    }, [mainContentRef.current]);

    return (
        <PublicLayout>
            <main className="relative bg-sbr-blue-dark text-primary-foreground" ref={mainContentRef}>
                <HeroSection />
                <AvailablitySection />
                <section id="contacto" className="relative z-0">
                    <div className="absolute inset-0 z-0 bg-[url('/agent_showcase.png')] bg-center bg-fixed bg-no-repeat brightness-90">
                        {/* <img src="/agent_showcase.png" alt="" className="h-full w-full object-cover object-center brightness-75" /> */}
                    </div>
                    <div className="opacity-0 translate-y-14" data-quote-form>
                        <ConqsQuoteForm />
                    </div>
                </section>
                <CardsSection />

                <section id="financiamiento" className="relative z-0 text-center space-y-3">
                    <div className="px-8 pt-16 space-y-6">
                        <h2 className="uppercase tracking-wide text-current/70">Financiamiento</h2>
                        <p className="text-4xl">Invierte fácil, sin bancos y sin intereses.</p>
                    </div>
                    <div className="relative z-0 w-full aspect-video">
                        <img src="/agent_showcase_2.jpg" alt="Imagen demostrativa de un agente SIBRA explicando a los clientes el plan de pago." className="h-full w-full object-cover object-center brightness-75" />
                    </div>
                </section>
                <section id="oferta" className="relative z-0 flex flex-col items-center justify-center bg-secondary pb-12 space-y-8">
                    <div
                        className="relative z-10 w-4/5 max-w-xs -translate-y-2 translate-x-4 bg-linear-to-b from-sbr-blue to-sbr-blue-dark p-4 pt-24 rounded shadow space-y-4 opacity-0"
                        data-container
                    >
                        <div className="absolute top-6 -left-4 p-1 bg-card pl-8 rounded shadow-lg -translate-x-6 opacity-0" data-badge>
                            <h2 className="text-lg font-bold text-gray-800 uppercase">Oferta</h2>
                        </div>
                        <p className="text-5xl font-bold scale-0" data-oferta-price>
                            $36,458<span className="text-2xl font-normal tracking-wide ml-1.5">MES</span>
                        </p>
                        <ul className="px-4">
                            <li className="flex items-center gap-2 -translate-x-6 opacity-0" data-feat-item>
                                <CheckCircle2 className="size-8 stroke-sbr-blue-light fill-current" />
                                <span className="text-sm">Agua, luz y drenaje.</span>
                            </li>
                            <li className="flex items-center gap-2 -translate-x-6 opacity-0" data-feat-item>
                                <CheckCircle2 className="size-8 stroke-sbr-blue-light fill-current" />
                                <span className="text-sm">Plusvalía.</span>
                            </li>
                            <li className="flex items-center gap-2 -translate-x-6 opacity-0" data-feat-item>
                                <CheckCircle2 className="size-8 stroke-sbr-blue-light fill-current" />
                                <span className="text-sm">Áreas verdes.</span>
                            </li>
                            <li className="flex items-center gap-2 -translate-x-6 opacity-0" data-feat-item>
                                <CheckCircle2 className="size-8 stroke-sbr-blue-light fill-current" />
                                <span className="text-sm">Privacidad y seguridad.</span>
                            </li>
                            <li className="flex items-center gap-2 -translate-x-6 opacity-0" data-feat-item>
                                <CheckCircle2 className="size-8 stroke-sbr-blue-light fill-current" />
                                <span className="text-sm">Pie de Blvd.</span>
                            </li>
                        </ul>
                        <div className="relative z-0 px-2">
                            <div className="relative z-10 w-fit px-2.5 py-1 bg-linear-to-b from-sbr-green-dark to-sbr-green rounded-xs">
                                <p className="text-lg font-semibold" style={{ marginBottom: "0px" }}>Dimensiones</p>
                            </div>
                            <div className="absolute z-0 flex justify-end bottom-0 right-0">
                                <img
                                    className="w-56 aspect-[3/1] translate-y-12 translate-x-10 scale-0"
                                    src="/land.webp"
                                    alt="Imagen representativa de la fracción de terreno en Conquistadores II."
                                    width="300"
                                    height="100"
                                    data-feat-land
                                />
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-800 text-end px-4">*Enganche desde <strong>$218,750 MXN</strong> · Resto en <strong>18 meses sin intereses</strong>.</p>
                </section>
                <section id="pasos" className="relative z-0 bg-card px-8 py-16 space-y-12">
                    <div className="mx-auto h-1 w-20 bg-sbr-blue-light rounded-full -mt-12"></div>
                    <ol className="space-y-6">
                        {
                            BuyingSteps.map((stepData, index) => (
                                <li key={index}>
                                    <BuyStepCard stepData={stepData} />
                                </li>
                            ))
                        }
                    </ol>
                </section>
                <section className="relative z-0 px-4 py-16 bg-accent space-y-6">
                    <div className="relative z-0 w-full aspect-[2/1] rounded-xs mb-12" >
                        <img
                            src="/sample.webp"
                            alt=""
                            className="w-full h-full object-cover object-center brightness-75 rounded-lg shadow-lg"
                            style={{
                                clipPath: "polygon(0% 0%, 100% 0%, 100% 85%, 0% 97%)",
                            }}
                        />
                        <div className="absolute -bottom-2 inset-x-0">
                            <h2
                                className="text-5xl font-medium tracking-tighter uppercase"
                                style={{ textShadow: "0px 0px 8px rgba(0,0,0,0.65)" }}
                            >
                                Ubicación
                            </h2>
                        </div>
                    </div>
                    <div className="bg-gray-200 aspect-[4/3] rounded-lg">
                        <iframe
                            className="w-full h-full object-cover border-0 rounded-lg"
                            src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d2249.4186266257207!2d-104.6054537871626!3d23.99755376264779!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjPCsDU5JzUxLjUiTiAxMDTCsDM2JzE2LjkiVw!5e1!3m2!1sen!2smx!4v1760571453942!5m2!1sen!2smx"
                            width="400"
                            height="300"
                            allowFullScreen={false}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade">
                        </iframe>
                    </div>
                    <p className="text-xs text-gray-800 text-center">Unete a +30 familias Clientes que ya aseguraron su terreno y construyeron su patrimonio.</p>
                    <div className="flex items-center gap-2.5 bg-linear-to-r from-sbr-blue-dark to-sbr-blue-light rounded-xs p-2">
                        <div className="basis-1/3 shrink-0 grow-0">
                            <p className="text-tiny font-semibold text-current">
                                Espaldas de la Feria Nacional de Durango.
                            </p>
                        </div>
                        <div className="basis-0.5 shrink-0 grow-0 h-7 border-l-2 border-dashed my-auto"></div>
                        <div className="basis-1/3 shrink-0 grow-0">
                            <p className="text-tiny font-semibold text-current">Lunes a domingo. 9:00 a.m. – 6:00 p.m.</p>
                        </div>
                        <div className="basis-0.5 shrink-0 grow-0 h-7 border-l-2 border-dashed my-auto"></div>
                        <div className="basis-1/3 shrink-0 grow-0">
                            <p className="text-tiny font-semibold text-current">Plusvalía.</p>
                        </div>
                    </div>
                </section>

                <div id="contacto-bottom" className="bg-secondary text-gray-800 px-4 py-16 space-y-6">
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold">Agenda tu visita o contáctanos</h2>
                        <ul className="grid grid-cols-[auto_auto] gap-2">
                            <li className="col-span-full grid grid-cols-subgrid gap-2">
                                <strong className="w-fit flex gap-2">
                                    <MapPin className="text-destructive" />
                                    <span>Dirección:</span>
                                </strong>
                                <span>Espaldas de la Feria Nacional, Durango</span>
                            </li>
                            <li className="col-span-full grid grid-cols-subgrid justify-between gap-2">
                                <strong className="w-fit flex gap-2">
                                    <Clock className="text-sbr-blue" />
                                    <span>Horario:</span>
                                </strong>
                                <span>Lunes a domingo · 9:00 a.m. – 6:00 p.m.</span>
                            </li>
                            <li className="col-span-full grid grid-cols-subgrid justify-between gap-2">
                                <strong className="w-fit flex gap-2">
                                    <Phone className="fill-current" />
                                    <span>Tel / WhatsApp:</span>
                                </strong>
                                <span>618 123 4567</span>
                            </li>
                        </ul>
                    </div>
                    <ConqsFooterQuoteForm />
                    <p style={{ marginTop: "20px" }}>Terrenos listos. Escritura lista. Solo faltas tú.</p>
                </div>

                <div className="text-gray-800">
                    {/* <section style={{ background: "#fffaf3" }}> */}
                    {/*     <h2>Por qué elegir Conquistadores 2</h2> */}
                    {/*     <div className="cards"> */}
                    {/*         <div className="card"> */}
                    {/*             <h3>🏡 Listos para escriturar</h3> */}
                    {/*             <p>Terrenos reales, propiedad segura. Entrega inmediata con escritura en mano.</p> */}
                    {/*         </div> */}
                    {/*         <div className="card"> */}
                    {/*             <h3>💧 Servicios completos</h3> */}
                    {/*             <p>Agua, luz, drenaje y pavimento ya instalados.</p> */}
                    {/*         </div> */}
                    {/*         <div className="card"> */}
                    {/*             <h3>🛡️ Privada segura</h3> */}
                    {/*             <p>Acceso controlado, áreas verdes y juegos infantiles para toda la familia.</p> */}
                    {/*         </div> */}
                    {/*     </div> */}
                    {/*     <p style={{ marginTop: "20px" }}>Más que un desarrollo, es un espacio listo para vivir o invertir.</p> */}
                    {/*     <a href="#financiamiento" className="cta">Quiero ver los terrenos</a> */}
                    {/* </section> */}
                    {/**/}
                    {/* <section id="financiamiento" style={{ background: "#eef6ff" }}> */}
                    {/*     <h2>Compra fácil, sin bancos y sin intereses</h2> */}
                    {/*     <p>Enganche desde <strong>$218,750 MXN</strong> · Resto en <strong>18 meses sin intereses</strong> · Sin trámites bancarios.</p> */}
                    {/*     <div className="timeline"> */}
                    {/*         <span>🏁 Aparta tu lote</span> → */}
                    {/*         <span>📄 Firma escritura</span> → */}
                    {/*         <span>📆 Paga mes a mes</span> */}
                    {/*     </div> */}
                    {/*     <p style={{ marginTop: "20px" }}>Mientras otros esperan permisos, tú ya estás firmando escritura.</p> */}
                    {/*     <a href="#contacto" className="cta">Solicitar plan de pago</a> */}
                    {/* </section> */}
                    {/**/}
                    {/* <section style={{ background: "#fff", }}> */}
                    {/*     <h2>Historias reales, decisiones inteligentes</h2> */}
                    {/*     <p>Clientes que ya aseguraron su terreno y firmaron escritura.</p> */}
                    {/*     <div className="cards"> */}
                    {/*         <div className="card"> */}
                    {/*             <p>“En dos semanas firmamos, sin trámites complicados.” – Familia Ramírez 🏡</p> */}
                    {/*         </div> */}
                    {/*         <div className="card"> */}
                    {/*             <p>“Privada terminada, lista para construir. Todo transparente.” – Luis & Ana</p> */}
                    {/*         </div> */}
                    {/*     </div> */}
                    {/*     <a href="#contacto" className="cta">Agendar recorrido este fin</a> */}
                    {/* </section> */}
                </div>

                <a href="https://wa.me/5216181234567" target="_blank" className="whatsapp-fixed">💬</a>
            </main>
        </PublicLayout>
    )
}

function HeroSection() {
    return (
        <section id="inicio" className="hero relative z-0">
            <div className="absolute inset-0 z-0">
                <img
                    className="h-full w-full object-cover object-center"
                    src="/hero_large.webp"
                    alt=""
                    data-hero-bgimg
                    style={{ filter: "brightness(100%)" }}
                />
            </div>
            <div className="relative z-10 bg-sbr-blue-dark/30 pt-40 opacity-0" data-backdrop>
                {/* <a href="#contacto" className="cta">Agendar mi visita</a> */}
                {/* <p style={{ fontSize: "0.9rem", marginTop: "10px" }}>Desde $875,000 MXN · Escritura inmediata</p> */}
            </div>
            <div className="absolute inset-x-0 -bottom-14 z-20 text-primary-foreground text-end px-5 space-y-1.5" data-content>
                <h1 className="text-4xl font-semibold tracking-wide opacity-0 translate-y-14" data-inview-animate>Conquistadores II</h1>
                <p className="text-xs text-current/70 opacity-0 translate-y-14" data-inview-animate>Servicios completos · Acceso controlado · Financiamiento directo sin intereses.</p>
            </div>
        </section>
    );
}

function AvailablitySection() {
    return (
        <section id="disponibilidad" className="pt-36 pb-20 px-4 space-y-6">
            {/* <h2 className="text-2xl font-bold text-current/80">Disponibilidad</h2> */}
            <div
                className="relative z-0"
            >
                <img
                    src="/disp1.png"
                    alt="Imagen del plano de disponibilidad del desarrollo Conquistadores II"
                    className="h-full w-full object-cover object-center rounded shadow-lg opacity-0"
                    data-avl-img
                />
                <div
                    className=" translate-y-14 opacity-0"
                    data-avl-content
                >
                    <Button
                        className="absolute -bottom-3 right-4 px-8 text-lg text-primary-foreground font-medium bg-linear-to-b from-sbr-green-light to-sbr-green rounded shadow-lg"
                        size="sm"
                    >
                        Ver Plano
                    </Button>
                </div>
            </div>
        </section>
    );
}

const features = [
    {
        title: "Listos para escriturar",
        description: "Terrenos reales, propiedad segura. Entrega inmediata con escritura en mano.",
        image: "/sample.webp",
    },
    {
        title: "Servicios completos",
        description: "Desarrollo de obra en proximos meses. Agua, luz, drenaje y pavimento",
        image: "/sample.webp",
    },
    {
        title: "Privada segura",
        description: "Acceso controlado, areas verdes y juegos para toda la familia.",
        image: "/sample.webp",
    },
] as const;

function FeatureCard({ data }: { data: typeof features[number] }) {
    return (
        <div className="col-span-1 space-y-3" data-card-wrapper>
            <h3 className="text-lg text-current/80 font-light opacity-0 translate-y-14" data-card-title>{data.title}</h3>
            <Card className="bg-linear-to-br from-sbr-green-light to-sbr-green border-0 p-4 py-10 rounded-md opacity-0 translate-y-14" data-card>
                <CardContent className="flex flex-col gap-8 text-gray-50 px-2">
                    <img src={data.image} alt="" className="w-full aspect-[4/3] object-cover object-center brightness-75 rounded" />
                    <p className="text-current/90 font-bold">{data.description}</p>
                </CardContent>
            </Card>
        </div>
    );
}

function CardsSection() {
    return (
        <section id="detalles" className="relative z-0 grid grid-cols-1 auto-rows-auto gap-12 px-4 py-16 pb-4 text-center">
            {
                features.map((feature) => (
                    <FeatureCard key={feature.title} data={feature} />
                ))
            }
            <p className="text-xs text-end">Más que un desarrollo, es un espacio listo para vivir o invertir.</p>
        </section>
    );
}

const BuyingSteps = [
    {
        step: 1,
        title: "Agenda Cita",
        description: ["Contactanos para conocer el desarrollo."],
        icon: <Phone className="size-8" />,
    },
    {
        step: 2,
        title: "Aparta tu lote",
        description: [
            "Aprovecha esta gran oferta...",
            "¡Ultimos 11 lotes disponibles!",
        ],
        icon: MapPin,
    },
    {
        step: 3,
        title: "Entrega del terreno",
        description: ["Recibe tu terreno contra-apartado."],
        icon: Phone,
    },
    {
        step: 4,
        title: "Construye",
        description: ["Junto a tus seres queridos da un paso a su patrimonio seguro."],
        icon: Clock,
    },
] as const;

function BuyStepCard({ stepData }: { stepData: typeof BuyingSteps[number] }) {
    return (
        <Card
            className="bg-sbr-green-dark -translate-x-14 opacity-0"
            style={{
                boxShadow: "0px 10px 1px -2px var(--color-sbr-green-light)",
            }}
            data-card-wrapper
        >
            <CardContent className="flex gap-4 text-primary-foreground px-5">
                <p className="text-5xl text-current/90 font-bold my-auto">{stepData.step}</p>
                <div className="space-y-1">
                    <h3 className="text-lg font-bold">{stepData.title}</h3>
                    {stepData.description.map((description, index) => (
                        <p key={index} className="text-current/70">
                            {description}
                        </p>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
