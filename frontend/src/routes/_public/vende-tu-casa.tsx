import { InfoForm } from '@/components/contact/InfoForm';
import { useUIStore } from '@/stores/uiStore';
import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react';
import { useEffect } from 'react';

export const Route = createFileRoute('/_public/vende-tu-casa')({
    component: RouteComponent,
    head: () => ({
        meta: [{
            title: "Vende tu casa | Sibra Inmobiliaria",
        }],
        links: [{
            rel: "preload",
            href: "/agent_showcase_3.webp",
            as: "image",
            fetchpriority: "high",
        }],
    }),
})

function RouteComponent() {
    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();

    useEffect(() => {
        setHeaderFloating(true);
        setHeaderComplementProps({ complementType: "none" });
    }, [])

    return (
        <main>
            <section className="relative z-0 h-dvh py-16 sm:py-24 px-6 sm:px-12 lg:px-20 xl:pt-32 xl:pb-52 transistion-[height] duration-100">
                <div className="absolute z-0 inset-0 w-full h-full bg-[url('/agent_showcase_3.webp')] bg-center bg-fixed bg-size-[auto_100%] brightness-70">
                </div>
                <div className="absolute z-0 inset-0 bg-surface-bright/8 backdrop-blur-xs"></div>
                <div className="contents h-full lg:flex lg:items-center lg:gap-40 lg:max-w-7xl mx-auto">
                    <div className="relative z-10 max-w-2xl xl:max-w-none xl:flex-1 xl:basis-3/5 text-white pt-6 mb-16 mx-auto xl:mx-0">
                        <motion.span
                            className="uppercase tracking-[0.1em] text-xs font-semibold block mb-2"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.1 }}
                        >Dejanos tus datos y nos pondremos en contacto</motion.span>
                        <motion.h1
                            className="text-6xl md:text-7xl font-headline font-extrabold tracking-tight leading-[1.1] text-on-background lg:mb-6 text-shadow-lg"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                        >
                            Cuentanos sobre tu <span className="text-sbr-green uppercase">propiedad.</span>
                        </motion.h1>
                        <p className="hidden xl:block text-lg text-current/80 font-medium max-w-md leading-relaxed text-shadow-lg">
                            Nuestro equipo de expertos está listo para conseguir el comprador de tu propiedad.
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
                            <InfoForm
                                formTitle="Dejanos tus datos"
                                submitLabel="Enviar Datos"
                                contactType="venta"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    )
}
