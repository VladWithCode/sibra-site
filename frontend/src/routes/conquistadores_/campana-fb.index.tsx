import { ConqsFooterQuoteForm, ConqsQuoteForm } from '@/components/contact/ConqsQuoteForm';
import { PublicLayout } from '@/components/layout/publicLayout'
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useUIStore } from '@/stores/uiStore'
import { createFileRoute } from '@tanstack/react-router'
import { Calendar, CheckCircle, CheckCircle2, Clock, MapPin, Phone } from 'lucide-react';
import { useEffect } from 'react';

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

    useEffect(() => {
        setHeaderFloating(true);
        setHeaderComplement("none");
    }, []);

    return (
        <PublicLayout>
            <main className="relative bg-sbr-blue-dark text-primary-foreground">
                <section className="hero relative z-0">
                    <div className="absolute inset-0 z-0">
                        <img
                            className="h-full w-full object-cover object-center brightness-75"
                            src="/hero_large.webp"
                            alt=""
                        />
                    </div>
                    <div className="relative z-10 bg-sbr-blue-dark/30 pt-36">
                        {/* <a href="#contacto" className="cta">Agendar mi visita</a> */}
                        {/* <p style={{ fontSize: "0.9rem", marginTop: "10px" }}>Desde $875,000 MXN · Escritura inmediata</p> */}
                    </div>
                    <div className="absolute inset-x-0 -bottom-20 z-20 text-primary-foreground text-end px-5">
                        <h1 className="text-4xl font-bold">Conquistadores II</h1>
                        <p className="text-xs">Servicios completos · Acceso controlado · Financiamiento directo sin intereses.</p>
                    </div>
                </section>

                <section className="pt-32 pb-12 px-4 space-y-6">
                    {/* <h2 className="text-2xl font-bold text-current/80">Disponibilidad</h2> */}
                    <div className="relative z-0">
                        <img
                            src="/sample.webp"
                            alt="Imagen del plano de disponibilidad del desarrollo Conquistadores II"
                            className="h-full w-full object-cover object-center rounded shadow-lg"
                        />
                        <p className="absolute -bottom-8 right-4 px-8 h-6 text-primary-foreground bg-sbr-green-dark rounded shadow-lg">
                            Disponibilidad
                        </p>
                    </div>
                </section>

                <section id="contacto" className="relative z-0">
                    <div className="absolute inset-0 z-0">
                        <img src="/agent_showcase.png" alt="" className="h-full w-full object-cover object-center brightness-75" />
                    </div>
                    <ConqsQuoteForm />
                </section>

                <section className="relative z-0 text-center space-y-3">
                    <div className="px-8 pt-16 space-y-6">
                        <h2 className="uppercase tracking-wide text-current/70">Financiamiento</h2>
                        <p className="text-4xl">Invierte fácil, sin bancos y sin intereses.</p>
                    </div>
                    <div className="relative z-0 w-full aspect-video">
                        <img src="/agent_showcase_2.jpg" alt="Imagen demostrativa de un agente SIBRA explicando a los clientes el plan de pago." className="h-full w-full object-cover object-center brightness-75" />
                    </div>
                </section>
                <section className="relative z-0 flex flex-col items-center justify-center bg-secondary py-2">
                    <div className="relative z-10 w-4/5 max-w-xs -translate-y-8 translate-x-4 bg-sbr-blue-light p-4 pt-24 rounded shadow space-y-4">
                        <div className="absolute top-6 -left-4 p-1 bg-card pl-8 rounded shadow-lg">
                            <h2 className="text-lg font-bold text-gray-800 uppercase">Oferta</h2>
                        </div>
                        <p className="text-5xl font-bold">$36,458<span className="text-2xl font-normal tracking-wide ml-1.5">MES</span></p>
                        <ul className="px-4">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="size-8 stroke-sbr-blue-light fill-current" />
                                <span className="text-sm">Agua, luz y drenaje.</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="size-8 stroke-sbr-blue-light fill-current" />
                                <span className="text-sm">Plusvalía.</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="size-8 stroke-sbr-blue-light fill-current" />
                                <span className="text-sm">Áreas verdes.</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="size-8 stroke-sbr-blue-light fill-current" />
                                <span className="text-sm">Privacidad y seguridad.</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="size-8 stroke-sbr-blue-light fill-current" />
                                <span className="text-sm">Pie de Blvd.</span>
                            </li>
                        </ul>
                        <div className="relative z-0 px-2">
                            <div className="relative z-10 w-fit px-2.5 py-1 bg-sbr-green-dark rounded-xs">
                                <p className="text-lg font-semibold" style={{ marginBottom: "0px" }}>Dimensiones</p>
                            </div>
                            <div className="absolute z-0 flex justify-end bottom-0 right-0">
                                <img
                                    className="w-56 aspect-[3/1] translate-y-12 translate-x-10"
                                    src="/land.webp"
                                    alt="Imagen representativa de la fracción de terreno en Conquistadores II."
                                    width="300"
                                    height="100"
                                />
                            </div>
                        </div>
                    </div>
                    <p className="text-tiny text-gray-800 text-end px-4">*Enganche desde <strong>$218,750 MXN</strong> · Resto en <strong>18 meses sin intereses</strong>.</p>
                </section>
                <section className="relative z-0 bg-card px-4 py-16 space-y-6">
                    <div className="mx-auto h-1 w-20 bg-sbr-blue-light rounded-full -mt-12"></div>
                    <ol className="space-y-6">
                        <li>
                            <Card
                                className="bg-sbr-green-dark"
                                style={{
                                    boxShadow: "0px 10px 1px -2px var(--color-sbr-green-light)",
                                }}
                            >
                                <CardContent className="flex gap-4 text-primary-foreground px-8">
                                    <p className="text-5xl text-current/90 font-bold my-auto">1</p>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold">Agenda Cita</h3>
                                        <p className="text-current/70">Contactanos para conocer el desarrollo.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </li>
                        <li>
                            <Card
                                className="bg-sbr-green-dark"
                                style={{
                                    boxShadow: "0px 10px 1px -2px var(--color-sbr-green-light)",
                                }}
                            >
                                <CardContent className="flex gap-4 text-primary-foreground px-8">
                                    <p className="text-5xl text-current/90 font-bold my-auto">2</p>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold">Agenda Cita</h3>
                                        <p className="text-current/70">Contactanos para conocer el desarrollo.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </li>
                        <li>
                            <Card
                                className="bg-sbr-green-dark"
                                style={{
                                    boxShadow: "0px 10px 1px -2px var(--color-sbr-green-light)",
                                }}
                            >
                                <CardContent className="flex gap-4 text-primary-foreground px-8">
                                    <p className="text-5xl text-current/90 font-bold my-auto">3</p>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold">Agenda Cita</h3>
                                        <p className="text-current/70">Contactanos para conocer el desarrollo.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </li>
                        <li>
                            <Card
                                className="bg-sbr-green-dark"
                                style={{
                                    boxShadow: "0px 10px 1px -2px var(--color-sbr-green-light)",
                                }}
                            >
                                <CardContent className="flex gap-4 text-primary-foreground px-8">
                                    <p className="text-5xl text-current/90 font-bold my-auto">4</p>
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-bold">Agenda Cita</h3>
                                        <p className="text-current/70">Contactanos para conocer el desarrollo.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </li>
                    </ol>
                </section>
                <section className="relative z-0 px-4 py-16 bg-accent space-y-3">
                    <div className="relative z-0 w-full aspect-[4/3] rounded-xs" >
                        <img
                            src="/sample.webp"
                            alt=""
                            className="w-full h-full object-cover object-center brightness-75 rounded-lg shadow-lg"
                            style={{
                                clipPath: "polygon(0% 0%, 100% 0%, 100% 85%, 0% 97%)",
                            }}
                        />
                        <div className="absolute bottom-0 inset-x-0">
                            <h2
                                className="text-5xl font-medium tracking-tighter uppercase"
                                style={{ textShadow: "0px 0px 8px rgba(0,0,0,0.65)" }}
                            >
                                Ubicación
                            </h2>
                        </div>
                    </div>
                    <div className="bg-gray-200 aspect-[4/3] rounded-lg"></div>
                    <p className="text-xs text-gray-800 text-center">Unete a +30 familias Clientes que ya aseguraron su terreno y construyeron su patrimonio.</p>
                    <div className="flex items-center gap-2.5 bg-linear-to-r from-sbr-blue-dark to-sbr-blue-light rounded-xs p-2">
                        <div className="basis-1/3 shrink-0 grow-0">
                            <p className="text-tiny font-semibold text-current">
                                Espaldas de la Feria Nacional de Durango.
                            </p>
                        </div>
                        <div className="basis-0.5 shrink-0 grow-0 h-8 bg-current my-auto"></div>
                        <div className="basis-1/3 shrink-0 grow-0">
                            <p className="text-tiny font-semibold text-current">Lunes a domingo. 9:00 a.m. – 6:00 p.m.</p>
                        </div>
                        <div className="basis-0.5 shrink-0 grow-0 h-8 bg-current my-auto"></div>
                        <div className="basis-1/3 shrink-0 grow-0">
                            <p className="text-tiny font-semibold text-current">Plusvalía.</p>
                        </div>
                    </div>
                </section>

                <section className="relative z-0 grid grid-cols-1 auto-rows-auto gap-y-8 px-4 py-16 text-center">
                    <div className="col-span-1 space-y-3">
                        <h3 className="text-lg font-light">Listos para escriturar</h3>
                        <Card className="bg-sbr-green-dark border-sbr-green-dark p-4">
                            <CardContent className="flex flex-col gap-4 text-gray-50 px-2">
                                <img src="/sample.webp" alt="" className="w-full aspect-[4/3] object-cover object-center brightness-75 rounded" />
                                <p className="text-current/90 font-semibold">Terrenos reales, propiedad segura. Entrega inmediata con escritura en mano.</p>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="col-span-1 space-y-3">
                        <h3 className="text-lg font-light">Servicios completos</h3>
                        <Card className="bg-sbr-green-dark border-sbr-green-dark p-4">
                            <CardContent className="flex flex-col gap-4 text-gray-50 px-2">
                                <img src="/sample.webp" alt="" className="w-full aspect-[4/3] object-cover object-center brightness-75 rounded" />
                                <p className="text-current/90 font-semibold">Desarrollo de obra en proximos meses. Agua, luz, drenaje y pavimento</p>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="col-span-1 space-y-3">
                        <h3 className="text-lg font-light">Privada segura</h3>
                        <Card className="bg-sbr-green-dark border-sbr-green-dark p-4">
                            <CardContent className="flex flex-col gap-4 text-gray-50 px-2">
                                <img src="/sample.webp" alt="" className="w-full aspect-[4/3] object-cover object-center brightness-75 rounded" />
                                <p className="text-current/90 font-semibold">Acceso controlado, areas verdes y juegos para toda la familia.</p>
                            </CardContent>
                        </Card>
                    </div>
                    <p className="text-tiny text-end">Más que un desarrollo, es un espacio listo para vivir o invertir.</p>
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
