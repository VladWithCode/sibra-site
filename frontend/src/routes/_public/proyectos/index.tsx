import { ProjectCard } from '@/components/projects/ProjectCard';
import { useUIStore } from '@/stores/uiStore';
import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react';

export const Route = createFileRoute('/_public/proyectos/')({
    component: RouteComponent,
})

function RouteComponent() {
    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();
    useEffect(() => {
        setHeaderFloating(true);
        setHeaderComplementProps({ complementType: "none" });
    }, []);

    return (
        <main className="bg-gray-200">
            <section className="relative z-0 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src="/sample.webp" alt="" className="w-full h-full object-cover object-center brightness-80" />
                </div>
                <div className="relative z-10 space-y-6 text-gray-50 px-6 pt-20 pb-12 bg-linear-to-b from-sbr-blue-dark/60 to-sbr-blue-light/60">
                    <h1 className="text-3xl font-semibold">Proyectos Sibra</h1>
                    <p className="text-muted font-medium">
                        En Sibra nos interesa brindarle a nuestros clientes las mejores opciones para
                        comenzar y expandir su patrimonio. Por eso, nos dedicamos a crear y desarrollar
                        proyectos inmobiliarios que ofrezcan grandes oportunidades para ellos.
                    </p>
                </div>
            </section>
            <section className="relative z-0 grid grid-cols-[repeat(auto-fill,_minmax(300px,_1fr))] gap-6 px-4 py-12">
                {projectListing.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </section>

        </main>
    );
}

const projectListing = [
    {
        id: 1,
        name: "Col. Emperadores",
        description: "Desarrollo SIBRA",
        slug: "colonia-emperadores",
        img: "/colonia-emperadores.webp",
        imgAlt: "Fotografía del Desarrollo Colonia Emperadores",
    },
    {
        id: 2,
        name: "Circuito Emperador",
        description: "Desarrollo SIBRA",
        slug: "circuito-emperador",
        img: "/circuito-emperador.webp",
        imgAlt: "Fotografía del Desarrollo Circuito Emperador",
    },
    {
        id: 3,
        name: "Circuito Emperador II",
        description: "Desarrollo SIBRA",
        slug: "circuito-emperador-ii",
        img: "/circuito-emperador-ii.webp",
        imgAlt: "Fotografía del Desarrollo Circuito Emperador II",
    },
    {
        id: 4,
        name: "Villa Emperadores",
        description: "Desarrollo SIBRA",
        slug: "villa-emperadores",
        img: "/villa-emperadores.webp",
        imgAlt: "Fotografía del Desarrollo Villa Emperadores",
    },
    {
        id: 5,
        name: "Conquistadores",
        description: "Desarrollo SIBRA",
        slug: "conquistadores",
        img: "/conquistadores.webp",
        imgAlt: "Fotografía del Desarrollo Conquistadores SIBRA",
    },
]
