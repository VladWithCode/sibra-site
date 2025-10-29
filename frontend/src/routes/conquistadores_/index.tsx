import { PublicLayout } from '@/components/layout/publicLayout'
import { useUIStore } from '@/stores/uiStore'
import { createFileRoute } from '@tanstack/react-router'
import { CheckCircle2 } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { animateSection } from './-animations';
import { WhatsappIcon } from '@/components/icons/whatsapp';
import { HeroSection } from './-HeroSection';
import { AvailablitySection } from './-AvailabilitySection';
import { CardsSection } from './-CardsSection';
import { ContactSection } from './-ContactSection';
import { StepsSection } from './-StepsSection';
import { LocationSection } from './-LocationSection';
import { PseudoFooter } from './-PseudoFooter';

export const Route = createFileRoute('/conquistadores_/')({
    component: RouteComponent,
    head: () => ({
        meta: [
            { title: "Conquistadores" },
            { name: "description", content: "Conoce el desarrollo Conquistadores que SIBRA Inmobiliaria ha hecho en Durango." },
        ],
        links: [
            {
                rel: "stylesheet",
                href: "/conquistadores.css",
            },
            {
                rel: "preload",
                as: "image",
                href: "/conq_video_poster.webp",
            },
        ],
        scripts: [
            {
                src: "/meta-pixel.js",
                async: true,
                defer: true,
                onError: (e) => {
                    console.error(e);
                },
            },
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
            <noscript>
                <img
                    height="1"
                    width="1"
                    style={{ display: "none" }}
                    src="https://www.facebook.com/tr?id=1585549779476712&ev=PageView&noscript=1"
                />
            </noscript>
            <main className="relative bg-sbr-blue-dark text-primary-foreground" ref={mainContentRef}>
                <HeroSection />
                <AvailablitySection />
                <CardsSection />
                <ContactSection />
                <section id="financiamiento" className="relative z-0 text-center space-y-3 sm:space-y-12">
                    <div className="px-8 pt-16 space-y-6">
                        <h2 className="sm:text-xl uppercase tracking-wide text-current/70">Financiamiento</h2>
                        <p className="text-4xl">Invierte fácil, sin bancos y sin intereses.</p>
                    </div>
                    <div className="relative z-0 w-full aspect-video sm:aspect-[3/2]">
                        <img src="/agent_showcase_2.webp" alt="Imagen demostrativa de un agente SIBRA explicando a los clientes el plan de pago." className="h-full w-full object-cover object-center brightness-75" />
                    </div>
                </section>
                <section id="oferta" className="relative z-0 flex flex-col items-center justify-center bg-secondary pb-12 space-y-8">
                    <div
                        className="relative z-10 w-4/5 max-w-md -translate-y-8 translate-x-4 sm:translate-x-24 bg-linear-to-b from-sbr-blue to-sbr-blue-dark p-4 sm:p-8 pt-24 sm:pt-32 rounded shadow space-y-4 opacity-0"
                        data-container
                    >
                        <div className="absolute top-6 -left-4 p-1 pl-8 sm:p-2 sm:pl-8 bg-card rounded shadow-lg -translate-x-6 opacity-0" data-badge>
                            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 uppercase">Oferta</h2>
                        </div>
                        <p className="text-5xl sm:text-6xl font-bold scale-0" data-oferta-price>
                            $36,458<span className="text-2xl font-normal tracking-wide ml-1.5">MES</span>
                        </p>
                        <ul className="px-4 sm:py-4 sm:space-y-1">
                            <li className="flex items-center gap-2 -translate-x-6 opacity-0" data-feat-item>
                                <CheckCircle2 className="size-8 stroke-sbr-blue-light fill-current" />
                                <span className="text-sm sm:text-base">Agua, luz y drenaje.</span>
                            </li>
                            <li className="flex items-center gap-2 -translate-x-6 opacity-0" data-feat-item>
                                <CheckCircle2 className="size-8 stroke-sbr-blue-light fill-current" />
                                <span className="text-sm sm:text-base">Plusvalía.</span>
                            </li>
                            <li className="flex items-center gap-2 -translate-x-6 opacity-0" data-feat-item>
                                <CheckCircle2 className="size-8 stroke-sbr-blue-light fill-current" />
                                <span className="text-sm sm:text-base">Áreas verdes.</span>
                            </li>
                            <li className="flex items-center gap-2 -translate-x-6 opacity-0" data-feat-item>
                                <CheckCircle2 className="size-8 stroke-sbr-blue-light fill-current" />
                                <span className="text-sm sm:text-base">Privacidad y seguridad.</span>
                            </li>
                            <li className="flex items-center gap-2 -translate-x-6 opacity-0" data-feat-item>
                                <CheckCircle2 className="size-8 stroke-sbr-blue-light fill-current" />
                                <span className="text-sm sm:text-base">Pie de Blvd.</span>
                            </li>
                        </ul>
                        <div className="relative z-0 px-2">
                            <div className="relative z-10 w-fit px-2.5 sm:px-3.5 py-1 sm:py-2 bg-linear-to-b from-sbr-green-dark to-sbr-green rounded-xs space-y-1">
                                <p className="text-lg sm:text-xl">Dimensiones</p>
                                <p className="text-xl sm:text-2xl font-bold">10m x 25m</p>
                            </div>
                            <div className="absolute z-0 flex justify-end bottom-0 right-0">
                                <img
                                    className="w-56 sm:w-80 aspect-[3/1] translate-y-12 sm:translate-y-20 translate-x-10 sm:translate-x-18 scale-0"
                                    src="/land.webp"
                                    alt="Imagen representativa de la fracción de terreno en Conquistadores II."
                                    width="300"
                                    height="100"
                                    data-feat-land
                                />
                            </div>
                        </div>
                    </div>
                    <p className="w-full text-xs sm:text-sm text-gray-800 text-end px-4 sm:px-8">*Enganche desde <strong>$218,750 MXN</strong> · Resto en <strong>18 meses sin intereses</strong>.</p>
                </section>
                <StepsSection />
                <LocationSection />
                <PseudoFooter />
                <a
                    href="https://wa.me/5216182298042?text=¡Hola! Me gustaría obtener más información de Conquistadores."
                    target="_blank"
                    className="whatsapp-fixed">
                    <WhatsappIcon className="text-gray-50 size-8" />
                    <span className="sr-only">Envianos un WhatsApp</span>
                </a>
            </main>
        </PublicLayout>
    )
}

