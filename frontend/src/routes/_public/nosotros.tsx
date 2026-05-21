import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { Gem, Mountain, Pen } from "lucide-react";

export const Route = createFileRoute("/_public/nosotros")({
    component: RouteComponent,
});

const philosophyItems = [
    {
        icon: Pen,
        title: "Diseño Intencionado",
        description:
            "Cada línea, material y fuente de luz es deliberada. Impulsamos espacios que respiran y funcionan con gracia natural.",
    },
    {
        icon: Gem,
        title: "La Verdad del Material",
        description:
            "Honramos la autenticidad de los materiales. La piedra, la madera y el acero son valorados por sus características innatas, que embellecen con el paso del tiempo.",
    },
    {
        icon: Mountain,
        title: "Armonía con el Entorno",
        description:
            "Un edificio debe dialogar con su entorno. Nuestras propiedades se integran de forma natural con su contexto urbano o natural.",
    },
];

const teamMembers: { name: string; role: string; bio: string; src: string; reverse?: boolean }[] = [
    {
        name: "Elena Rostova",
        role: "Curadora Principal",
        bio: "Con más de dos décadas dando forma a paisajes urbanos, Elena posee un ojo inigualable para el detalle. Su enfoque equilibra el pragmatismo arquitectónico con una sensibilidad refinada por la estética espacial, garantizando que cada propiedad de SIBRA sea una obra maestra del habitar contemporáneo.",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjLBceZ-JAgoguZyUcL-NetH9R0nnUNYm2V1D0VpmHzBeLqTrAj2E52jXYPSAkVjxHbhMyhTFvJurJpo7MLq1NLYPeEAv_6wOY7DfiL1wKyrG60TtIVOmapur6uHMC54wxZM6BkWhkI10jswQ_Lc_vuz6RK3Ho3HeUieZsjnYB6wz847AWZTfOoU5YWF3t1E4pw_XzL7dpRYy0OJcLVNQPPKN2B2_3jcSib02mYDd2WjzXMxCXhdk4Eg0OBYRJJnEnQQy9cZNOr3Q",
    },
    {
        name: "Marcus Chen",
        role: "Director de Adquisiciones",
        bio: "Marcus supervisa la incorporación selectiva a nuestro portafolio. Su visión estratégica y su profundo conocimiento de la dinámica del mercado solo son superados por su compromiso de preservar la integridad arquitectónica de cada activo que adquirimos.",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuAqREqXAFcltVAaBzmSnMUfqLdrrS-h2tqs4AecOZSHzo5glfmtfJS5lfpF-YWaeUWyCSeGuh-4K7UsyHhZJSx9POBJSbDuA5_mpoBvwNMWuh0LRNNjDq7TEDfMpN3gTVmWhhyOtjpKT0ambz4own-j5LY3MZWSadCgcP4e4Iwc2YCFuG5k7JXhEb_3tb5Tz3a0JJkZ83yngwdIR3SB1hLjX8t5gLF0WMzafQJDx6ov8vp4VLlrzb5WLdW3Zz5KdOvogKTWhzyYJSE",
        reverse: true,
    },
];

function PhilosophyCard({ icon: Icon, title, description }: (typeof philosophyItems)[number]) {
    return (
        <div className="bg-surface-container-lowest p-8 rounded-lg transition-transform hover:scale-[1.02] duration-300 flex flex-col items-start border border-outline-variant/15 shadow-[0_32px_64px_rgba(26,28,28,0.04)]">
            <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center mb-6">
                <Icon className="text-primary" size={22} />
            </div>
            <h4 className="text-xl font-semibold mb-3">{title}</h4>
            <p className="font-body text-on-surface-variant/80 text-sm">{description}</p>
        </div>
    );
}

function TeamMemberRow({ name, role, bio, src, reverse }: (typeof teamMembers)[number]) {
    return (
        <div className={`flex flex-col gap-8 items-center ${reverse ? "md:flex-row-reverse" : "md:flex-row"}`}>
            <div className="w-full md:w-1/3 aspect-[3/4] overflow-hidden rounded-lg">
                <img alt={`${name}, ${role}`} className="w-full h-full object-cover" src={src} />
            </div>
            <div className={`w-full md:w-2/3 ${reverse ? "md:pr-8" : "md:pl-8"}`}>
                <h3 className="text-2xl font-bold mb-1">{name}</h3>
                <p className="text-on-surface-variant/80 uppercase tracking-widest mb-6">{role}</p>
                <p className="text-on-surface-variant/60 leading-relaxed max-w-xl">{bio}</p>
            </div>
        </div>
    );
}

function RouteComponent() {
    return (
        <main className="w-full">
            <section className="relative w-full flex items-end overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        alt="Cinematic Architectural View"
                        className="w-full h-full object-cover"
                        src="/acercadenosotrosimg.webp"
                        loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-on-background/80 via-on-background/30 to-transparent"></div>
                </div>
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 xl:px-24 2xl:px-0 pt-60 2xl:pt-80 pb-16 md:pb-24 lg:pb-32">
                    <h1 className="font-headline text-5xl md:text-7xl font-extrabold text-on-primary tracking-tight mb-4 text-shadow-lg">
                        Forjando Legado.
                    </h1>
                    <p className="font-body text-lg text-outline-variant/80 max-w-xl">
                        Creamos espacios que trascienden lo funcional, diseñando entornos donde cada detalle eleva el estándar de vida.
                    </p>
                </div>
            </section>

            <section className="bg-surface">
                <div className="max-w-7xl mx-auto px-6 md:px-12 xl:px-24 2xl:px-0 py-12 md:py-20 lg:py-24">
                    <div className="max-w-2xl">
                        <h2 className="text-sm uppercase tracking-[0.2em] text-primary/80 mb-3 font-bold">Nuestra Esencia</h2>
                        <h3 className="text-3xl md:text-4xl font-semibold leading-tight mb-8">
                            Un compromiso con la solidez del diseño y la poesía del espacio.
                        </h3>
                        <div className="space-y-6 font-body text-on-surface-variant/60 leading-relaxed">
                            <p>
                                Desde nuestros inicios, SIBRA ha entendido el mundo inmobiliario no como simples transacciones, sino como la
                                creación del escenario de la vida. Creemos que la arquitectura tiene la profunda capacidad de moldear la
                                experiencia humana.
                            </p>
                            <p>
                                Nuestro portafolio es testimonio de esta convicción: una colección de espacios seleccionados por su calidad sin
                                concesiones, su visión innovadora y su valor perdurable. No somos solo desarrolladores; somos guardianes del
                                entorno que habitamos.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-surface-container-low">
                <div className="max-w-7xl mx-auto px-6 md:px-12 xl:px-24 2xl:px-0 py-12 md:py-24 lg:py-32">
                    <h2 className="font-headline text-3xl font-bold mb-12 text-center">La Filosofía del Curador</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {philosophyItems.map((item) => (
                            <PhilosophyCard key={item.title} {...item} />
                        ))}
                    </div>
                </div>
            </section>

            <section className="bg-surface">
                <div className="max-w-7xl mx-auto px-6 md:px-12 xl:px-24 2xl:px-0 py-12 md:py-24 lg:py-32">
                    <h2 className="font-headline text-3xl font-bold mb-16">Los Visionarios</h2>
                    <div className="flex flex-col gap-16">
                        {teamMembers.map((member) => (
                            <TeamMemberRow key={member.name} {...member} />
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative bg-sbr-blue text-on-primary overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <img
                        alt="Background Texture"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnofUE5ZmdN-4Sl_dJobcL1rUM6Njc5N2zWY_qreELYW24OhY7pfFy5Njtth302NWPT44HY_u91hXryLUso1CpGYdyhvvaSfPtY5hRghNYWxUUeCCaqQnp48muyPwWUWD0Sc9xsihINWaWCPm9nexoxxleOmCEAQeezok1b0QUBxHgYGVUbSqLJIkvyFSw68URr9ZF_QNN-pagbMorh70oLWP7kXskaIofoWDK2CNgW6BFYRh02uNJsHLpV_Wan36O0Y_7fgn1T4Y"
                    />
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 xl:px-24 2xl:px-0 py-16 md:py-24 lg:py-32 flex flex-col items-center text-center">
                    <h2 className="font-headline text-4xl md:text-5xl font-bold mb-6">Descubre la Colección</h2>
                    <p className="font-body text-outline-variant/80 mb-10 text-lg max-w-2xl">
                        Explora nuestro portafolio de propiedades excepcionales, donde el diseño visionario se encuentra con la calidad sin
                        concesiones.
                    </p>
                    <Button className="h-auto bg-gradient-to-br from-sbr-blue to-sbr-blue-light text-on-primary-container px-8 py-4 rounded-md font-label font-medium uppercase tracking-widest text-sm hover:scale-[1.02] transition-transform duration-300">
                        Ver Propiedades
                    </Button>
                </div>
            </section>
        </main>
    );
}
