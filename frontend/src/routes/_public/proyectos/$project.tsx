import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { checkProjectAccess, getProjectBySlugOpts, getProjectDocsOpts, getProjectsOpts } from '@/queries/projects';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, ChevronDown, ChevronUp, CircleX, ImageIcon, MapPin, StarIcon, TrendingUp, VerifiedIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import type { TProject, TProjectAmenity, TProjectAssociate, TProjectCheckAccessResult, TProjectDoc } from '@/queries/type';
import { toast } from 'sonner';
import { PalapaIcon, PlaygroundIcon, PoolIcon } from '@/components/icons/icons';
import { cn } from '@/lib/utils';
import { MDash } from '@/components/util';
import { ProjectImage } from '@/components/Image';
import { AnimatePresence, motion } from 'motion/react';
import { DynamicIcon } from 'lucide-react/dynamic';

const APPEAL_ICONS = [VerifiedIcon, TrendingUp, MapPin, StarIcon] as const;

export const Route = createFileRoute('/_public/proyectos/$project')({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        await context.queryClient.ensureQueryData(getProjectBySlugOpts(params.project));
    },
})

function RouteComponent() {
    const { project } = Route.useParams();
    const { data, status, error } = useSuspenseQuery(getProjectBySlugOpts(project))

    if (status === "error") {
        return <ProjectFetchError error={error} />
    }

    const projectData = data.project

    return (
        <main>
            <section className="relative w-full flex items-end overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        className="w-full h-full object-cover transform scale-105"
                        src={projectData.main_img ? `/static/uploads/${projectData.main_img}` : "/sample.webp"}
                        alt={`Imagen principal del proyecto ${projectData.name}`}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-surface-container to-65% to-surface-container/0"></div>
                </div>
                <div className="relative z-10 xl:max-w-7xl mx-auto p-6 md:px-12 xl:px-24 2xl:px-0 pt-60 pb-32 w-full">
                    <div className="flex flex-col md:items-end xl:items-start justify-between gap-8">
                        <div className="space-y-6">
                            <h1 className="max-w-full text-5xl md:text-8xl text-white font-semibold leading-none text-shadow-lg">
                                {projectData.name}
                            </h1>
                            {projectData.location && (
                                <div className="flex items-center gap-3 text-white">
                                    <MapPin className="text-current" />
                                    <p className="font-medium">{projectData.location}</p>
                                </div>
                            )}
                        </div>
                        <Link
                            className="flex items-center gap-6 bg-sbr-blue text-on-primary p-2 px-8 mr-auto rounded-sm"
                            to="#contacto"
                        >
                            <span>Obtener una cita</span>
                            <ArrowRight className="stroke-2" />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="bg-surface-container relative z-20">
                <div className="max-w-7xl mx-auto px-6 md:px-12 xl:px-24 2xl:px-0 md:pt-12 -translate-y-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-center *:h-full">
                        <div className="flex flex-col items-start md:items-start bg-surface border-l-4 border-sbr-blue-light p-3 rounded-sm shadow-md">
                            <span className="text-on-surface-variant/80 text-xs uppercase tracking-widest mb-3">Superficie Total</span>
                            <p className="text-3xl font-headline font-bold text-primary">
                                {projectData.total_area > 0 ? `${projectData.total_area.toLocaleString("es-MX")} m²` : <MDash />}
                            </p>
                            <p className="text-on-surface-variant/60 text-sm mt-1">Terreno Arquitectónico Premium</p>
                        </div>
                        <div className="flex flex-col items-start md:items-start bg-surface border-l-4 border-sbr-blue-light p-3 rounded-sm shadow-md">
                            <span className="text-on-surface-variant/60 text-xs uppercase tracking-widest mb-3">Disponibilidad</span>
                            <p className="text-3xl font-headline font-bold text-primary">
                                {projectData.lot_count > 0 ? `${projectData.available_lots}/${projectData.lot_count} Lotes` : <MDash />}
                            </p>
                        </div>
                        {/* <div className="md:px-8 flex flex-col items-center md:items-start"> */}
                        {/*     <span className="text-on-surface-variant font-label text-xs uppercase tracking-widest mb-2">Proyección de Inversión</span> */}
                        {/*     <p className="text-3xl font-headline font-bold text-primary">18.4% ROI</p> */}
                        {/*     <p className="text-on-surface-variant/60 text-sm mt-1">Ganancias de Capital Anuales Proyectadas</p> */}
                        {/* </div> */}
                    </div>
                </div>
            </section>

            <section className="py-12 md:py-24 lg:py-32 bg-surface-container">
                <div className="max-w-7xl mx-auto px-6 md:px-12 xl:px-24 2xl:px-0 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                    <div className="lg:col-span-7 space-y-8">
                        <span className="text-primary/60 font-medium tracking-tight text-sm uppercase mb-3 block">La Filosofía</span>
                        {projectData.quote && (
                            <h2 className="text-3xl font-bold text-on-surface tracking-tighter leading-tight">
                                {projectData.quote}
                            </h2>
                        )}
                        {projectData.summary && (
                            <div className="space-y-6 text-on-surface-variant leading-relaxed">
                                {projectData.summary.split(/\n{2,}/).map((paragraph, i) => (
                                    <p key={i}>{paragraph}</p>
                                ))}
                            </div>
                        )}
                        <div className="mt-12 flex items-center gap-8">
                            <div className="flex -space-x-4">
                                <img className="w-14 h-14 rounded-full border-4 border-surface" data-alt="portrait of a senior male architect with glasses looking professional" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAiRdAJYXGhzTQEAZuyq0WDHfrocxsABDfB7TQauXfgMdGmlmsnW0LUJ6IIWeTTinUX7uWAKXq3eTXTNkEfvLSFYnR_N5lAVDJe_lYTKb7gKuwbllzmhpvJg5gJJJE__XDoIEvwbisFuoOoPxip-npkklNuWqcfr3vL2v2WtcfaxXbieaFgv_ywPbjIIupAM6vjUHUZjW0U6IID1OVg6gWdUQEKUZfW7G2ZvP8o8XhWnD8zbb87QuBj7dzOe1YJ7Q09D43hIL4mHPQ" />
                                <img className="w-14 h-14 rounded-full border-4 border-surface" data-alt="portrait of a professional female urban planner in a business suit" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEmUnXF1_Sf1Urhu_etYTQkfE8kQ6IXV3ZM4u0aydPYNaCHRfj6dA3roitc_wqg1EsaF0hVZ85gNBXC7SwYvmGAP718SdWtUC4n6Wi5CSFeyA4CVF0S-5AQ_kfXr4edysPUILUm08Pnt6wrmo94_QTsh-IMuT9jAr5hdy5I8AIw6Ju3vhRVOTwAZ_kK7qf1NRIeo7m4_LqHTpRQg9PI8Bsg4pQIZe8Y8JuNHHlP-M7oSdWNeQOBuNyUvglN_QYnIV7nsbLijbMdMA" />
                            </div>
                            <div>
                                <p className="font-headline font-bold text-on-surface">Diseño Curado por Sibra.mx</p>
                                <p className="text-sm text-on-surface-variant">Arquitectos Principales y Curadores Urbanos</p>
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-5 relative">
                        <div className="aspect-[4/5] bg-surface-container-high rounded-xl overflow-hidden shadow-2xl">
                            <img className="w-full h-full object-cover" data-alt="Detailed close up of premium limestone textures and glass intersections in a modern tropical villa" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiehPqWG-qIbWnxcXsFQX0Xes38qXMrgZJ5DiYOjABD63oCA96upYb25zlmBt10wjBU_HDPZVHiU9DSnwd4PPeIr3UI5dM1QxyitXl3gJvgWmabR4zUq4r1Lf6jpboVyJARyL7JmcPTqrs79iYT-_h4gEsIr2Bs0i2XqFNGrGSGGjgQLJYj06Gc2C-FNs8h_CqJgGdrSCJU7lrPouu4ocP7wObMeBIKPIBrFcZzVdHUDZ1lyqAT9Krr7Dd4JEHs7O9lg5PIlD65yE" />
                        </div>
                        {projectData.lot_count > 0 && (
                            <div className="absolute -bottom-8 -left-8 bg-primary p-8 text-white rounded-lg shadow-xl hidden md:block">
                                <p className="text-4xl font-headline font-black">{projectData.lot_count}</p>
                                <p className="text-xs uppercase tracking-widest font-bold">Lotes Totales</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="py-12 md:pb-24 lg:py-32 bg-surface-container-low overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 md:px-12 2xl:px-0 mb-16">
                    <h2 className="text-3xl font-headline font-bold text-on-surface tracking-tighter mb-4 text-center">Descripción General del Plan Maestro</h2>
                    <p className="text-on-surface-variant/60 text-center max-w-2xl mx-auto">Distribuciones estratégicamente distribuidas diseñadas para máxima privacidad y ventilación.</p>
                </div>
                <div className="max-w-7xl mx-auto px-6 xl:px-24 2xl:px-0 relative">
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
                        <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl overflow-hidden aspect-video shadow-sm border border-outline-variant/10 relative">
                            {projectData.availability_img ? (
                                <ProjectImage
                                    projName={projectData.name}
                                    src={projectData.availability_img}
                                    className="w-full h-full object-cover opacity-80"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-on-surface-variant/60 text-sm">
                                    Plano de disponibilidad próximamente
                                </div>
                            )}
                        </div>
                        <div className="col-span-2">
                            <AmenitiesCarousel projectData={projectData} />
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-12 md:py-24 lg:py-32 bg-surface space-y-6 md:space-y-12">
                <div className="max-w-7xl flex flex-col md:flex-row justify-between md:items-end gap-6 px-6 md:px-12 xl:px-24 2xl:px-0 mx-auto">
                    <div>
                        <h2 className="text-3xl font-bold text-on-surface tracking-tighter mb-4">Galería Arquitectónica</h2>
                        <p className="text-on-surface-variant/60">Un viaje visual a través del alma del desarrollo.</p>
                    </div>
                </div>
                <div className="max-w-7xl md:px-3 lg:px-12 xl:px-24 2xl:px-0 mx-auto">
                    <ProjectGallery projectData={projectData} />
                </div>
            </section>

            {projectData.appeal_list && projectData.appeal_list.length > 0 && (
                <section className="py-12 bg-surface-container-low">
                    <div className="max-w-7xl mx-auto px-8 md:px-12 xl:px-24 2xl:px-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {projectData.appeal_list.map((item, i) => {
                                const Icon = APPEAL_ICONS[i % APPEAL_ICONS.length];
                                return (
                                    <div
                                        key={item.id}
                                        className="bg-surface-container-lowest p-10 rounded-2xl border border-outline-variant/10 hover:shadow-2xl transition-all duration-500 group"
                                    >
                                        <div className="w-14 h-14 signature-gradient rounded-xl flex items-center justify-center text-white mb-8 group-hover:-translate-y-2 transition-transform duration-300">
                                            <Icon />
                                        </div>
                                        <h3 className="text-xl font-headline font-bold text-on-surface mb-4">{item.name}</h3>
                                        <p className="text-on-surface-variant/60 leading-relaxed">{item.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            <section className="bg-surface-container px-6 md:px-12 py-12 md:py-24 lg:py-32 space-y-6 lg:space-y-12">
                <div className="space-y-3 md:text-center">
                    <h2 className="text-3xl">Portal de Asociados</h2>
                    <p className="text-current/60">
                        Accede a los documentos actualizados del proyecto y revisa si tienes algún saldo pendiente.
                    </p>
                </div>
                <ProjectAssociates projectData={projectData} />
            </section>
        </main>
    );
}

function ProjectFetchError({ error }: { error: Error }) {
    return (
        <main className="relative z-0 bg-gray-200">
            <div className="absolute inset-0 z-0">
                <img src="/sample.webp" alt="" className="w-full h-full object-cover object-center brightness-80" />
            </div>
            <div className="relative z-10 flex flex-col gap-12 px-6 pt-24 pb-20 text-gray-50 bg-linear-to-b from-sbr-blue-dark/60 to-sbr-blue-light/60">
                <h1 className="flex flex-col gap-1.5 text-6xl text-current/80 font-bold text-center">
                    Ocurrió un error inesperado
                </h1>
                <p className="text-gray-50 font-semibold">
                    {error !== null ?
                        error.message
                        : "Ocurrió un error al recuperar los datos del proyecto. Intenta de nuevo más tarde."
                    }
                </p>
                <Button className="mx-auto font-bold" variant="default" size="lg" asChild>
                    <Link to="/proyectos">Regresar a Proyectos</Link>
                </Button>
            </div>
        </main>
    )
}

function SimilarProjects({ projectData }: { projectData: TProject }) {
    const { data, status, error } = useQuery(getProjectsOpts);
    const similarProjects = useMemo(() => {
        if (status !== "success") {
            return [];
        }

        return data.projects.filter(p => p.id !== projectData.id).slice(0, 2);
    }, [status]);

    if (status === "error") {
        return <ProjectFetchError error={error} />
    }

    if (status === "pending") {
        return (
            <div className="flex flex-col items-center justify-center gap-6 py-24 px-6 text-center">
                <span className="loader"></span>
                <p className="text-xl font-bold text-muted-foreground">Cargando proyectos similares...</p>
            </div>
        );
    }

    return (
        <section className="pt-6 sm:pt-12 space-y-6 xl:space-y-12">
            <h3 className="text-xl sm:text-3xl xl:text-4xl font-bold text-center">Otros Proyectos de SIBRA</h3>
            <div className="grid grid-cols-1 xl:grid-cols-2 auto-rows-auto">
                {data.projects.length === 0
                    ? (
                        <div className="relative flex items-center justify-center w-full aspect-video px-6 py-12">
                            <p className="font-medium leading-tight text-center text-current/80">
                                No hay proyectos similares disponibles
                            </p>
                        </div>
                    )
                    : similarProjects.map((project) => (
                        <Link to={`/proyectos/${project.slug}`} className="relative z-0" key={project.id}>
                            <div className="absolute inset-0 z-0">
                                <img
                                    src={"/static/uploads/" + project.main_img}
                                    alt={"Imagen principal mostrando el proyecto " + project.name}
                                    className="w-full h-full object-cover object-center brightness-75"
                                />
                            </div>
                            <div className="relative z-10 flex items-center justify-center gap-3 bg-gray-700/50 py-28 xl:py-36 px-6">
                                <h4 className="text-lg sm:text-2xl font-semibold">{project.name}</h4>
                            </div>
                        </Link>
                    ))}
            </div>
        </section>
    );
}

function AmenityCard({ amenity, delay }: { amenity: TProjectAmenity, delay?: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: delay ?? 0 }}
            viewport={{ once: true, amount: 0.3 }}
            className="relative aspect-square rounded-xl border border-outline-variant/30 shadow"
        >
            {/* <div className="absolute inset-0 flex items-center justify-center brightness-75"> */}
            {/*     { */}
            {/*         amenity.img */}
            {/*             ? ( */}
            {/*                 <ProjectImage */}
            {/*                     projName={"Amenidad de proyecto"} */}
            {/*                     src={amenity.img} */}
            {/*                     alt={amenity.name} */}
            {/*                     className="w-full h-full object-cover object-center" */}
            {/*                 /> */}
            {/*             ) : ( */}
            {/*                 <AmenityIcon className="size-24 lg:size-1/3 text-sbr-blue" icon={amenity.icon} /> */}
            {/*             ) */}
            {/*     } */}
            {/* </div> */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center gap-3 bg-sbr-blue text-on-primary p-6 rounded-md">
                <div className="">
                    <AmenityIcon className="size-6 text-on-primary" icon={amenity.icon} />
                </div>
                <h4 className="font-headline font-bold text-center line-clamp-1 text-ellipsis">{amenity.name}</h4>
            </div>
        </motion.div>
    );
}

function AmenitiesCarousel({ projectData }: { projectData: TProject }) {
    const toggleableAmenities = useMemo(() => {
        if (!projectData.amenities?.length) {
            return { visible: [], rest: [] };
        }

        const visible = projectData.amenities.slice(0, 4);
        const rest = projectData.amenities.slice(4);

        return { visible, rest };
    }, [projectData.amenities]);
    const [showAll, setShowAll] = useState(false);

    if (!projectData.amenities || projectData.amenities.length === 0) {
        return (
            <div className="relative flex items-center justify-center max-w-lg w-full aspect-video px-6 py-12 mx-auto">
                <p className="lg:text-lg font-medium leading-tight text-center text-current/80">
                    Aún no se han agregado las amenidades del proyecto.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 overflow-hidden">
            <div className="grid grid-cols-2 gap-6">
                {toggleableAmenities.visible.map((amenity, idx) => (
                    <AmenityCard key={amenity.id} amenity={amenity} delay={idx * 0.0675} />
                ))}
                {!showAll && toggleableAmenities.rest.length > 0 && (
                    <div className="col-span-full flex justify-center">
                        <Button
                            className="flex items-center gap-3 text-sbr-blue p-2 px-8 rounded-sm"
                            onClick={() => setShowAll(true)}
                            variant="ghost"
                        >
                            <span>Mostrar más</span>
                            <ChevronDown className="size-4" />
                        </Button>
                    </div>
                )}
            </div>
            {
                toggleableAmenities.rest.length > 0 && (
                    <AnimatePresence>
                        {showAll && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                className="grid grid-cols-2 gap-6 overflow-hidden"
                            >
                                {toggleableAmenities.rest.map((amenity, idx) => (
                                    <AmenityCard key={amenity.id} amenity={amenity} delay={idx * 0.0675} />
                                ))}
                                <div className="col-span-full flex justify-center">
                                    <Button
                                        className="flex items-center gap-3 text-sbr-blue p-2 px-8 rounded-sm"
                                        onClick={() => setShowAll(false)}
                                        variant="ghost"
                                    >
                                        <span>Mostrar menos</span>
                                        <ChevronUp className="size-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )
            }
        </div>
    );
}

type TAmenityIcon = "pool" | "playground" | "palapa" | "services" | string;

function AmenityIcon({ icon, className }: { icon: TAmenityIcon, className?: string }) {
    const _className = cn("text-primary", className);
    switch (icon) {
        case "pool":
            return <PoolIcon className={cn(_className, "lg:size-3/4 2xl:size-2/3")} />;
        case "playground":
            return <PlaygroundIcon className={_className} />;
        case "palapa":
            return <PalapaIcon className={_className} />;
        // case "services":
        //     return <ServicesIcon className={_className} />;
        default:
            return <DynamicIcon className={_className} name={icon as unknown as any} />;
    }
}

function ProjectGallery({ projectData }: { projectData: TProject }) {
    const [open, setOpen] = useState(false);
    const [showHint, setShowHint] = useState(true);
    const [currentImage, setCurrentImage] = useState<string>(projectData.main_img);

    useEffect(() => {
        let timerId = setTimeout(() => {
            setShowHint(false);
        }, 5000);

        return () => {
            clearTimeout(timerId);
        };
    }, []);

    if (!projectData.gallery || projectData.gallery.length === 0) {
        return (
            <div className="p-2">
                <p className="flex items-center justify-center aspect-video text-gray-800 sm:text-lg font-medium leading-tight text-center text-current/80 bg-surface-container-highest px-6 py-12 rounded-lg">
                    Aún no hay fotos de este proyecto
                </p>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="relative aspect-video w-full h-auto p-0 group rounded-lg overflow-hidden" variant="ghost">
                    <div
                        className="absolute z-10 inset-0 flex items-center justify-center bg-sbr-blue/50 backdrop-blur-sm transition-opacity duration-300 opacity-0 group-hover:opacity-100 cursor-pointer data-[show-hint=true]:opacity-100"
                        data-show-hint={showHint}
                    >
                        <p className="flex items-center justify-center gap-3 text-xl font-semibold text-on-primary" data-show-hint={showHint}>
                            <ImageIcon className="size-8" />
                            Ver galería
                        </p>
                    </div>
                    <div className="relative z-0 w-full h-full md:grid md:grid-cols-5 md:grid-rows-2 md:gap-3 lg:gap-6">
                        <ProjectImage
                            projName={projectData.name}
                            src={projectData.main_img}
                            className="w-full h-full col-span-3 row-span-2 object-cover object-center md:rounded-md"
                            alt={projectData.name}
                        />
                        <ProjectImage
                            projName={projectData.name}
                            src={projectData.gallery[0]}
                            className="hidden md:block col-span-2 w-full h-full object-cover object-center rounded-md"
                            alt={projectData.name}
                        />
                        <ProjectImage
                            projName={projectData.name}
                            src={projectData.gallery[1]}
                            className="hidden md:block col-span-2 w-full h-full object-cover object-center rounded-md"
                            alt={projectData.name}
                        />
                    </div>
                </Button>
            </DialogTrigger>
            <DialogContent className="grid grid-cols-1 grid-rows-[1fr_auto] pt-3 px-0 gap-3">
                <DialogHeader className="text-start px-3">
                    <DialogTitle className="text-lg font-bold">
                        Galería de {projectData.name}
                    </DialogTitle>
                </DialogHeader>
                <div className="max-w-full overflow-hidden">
                    <img
                        src={"/static/uploads/" + currentImage}
                        alt={projectData.name}
                        className="w-full object-contain object-center"
                    />
                </div>
                <div className="p-2 pt-0">
                    <Carousel opts={{
                        align: "start",
                    }}>
                        <CarouselContent className="[&>*]:pl-4 px-1">
                            {projectData.gallery.map((img) => (
                                <div className="flex shrink-0 basis-3/4 aspect-video">
                                    <Button
                                        variant="ghost"
                                        className="w-full h-full p-0"
                                        onClick={() => setCurrentImage(img)}
                                    >
                                        <img
                                            src={"/static/uploads/" + img}
                                            alt={projectData.name}
                                            className="w-full h-full object-cover object-center rounded-lg"
                                        />
                                    </Button>
                                </div>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ProjectAssociates({ projectData }: { projectData: TProject }) {
    const [open, setOpen] = useState(false);
    const [customerAuthenticated, setCustomerAuthenticated] = useState(false);
    const [customerData, setCustomerData] = useState<TProjectAssociate | null>(null);
    const onAuthenticate = useCallback((data: TProjectCheckAccessResult) => {
        setCustomerAuthenticated(data.authorized);
        if (data.authorized) {
            setCustomerData(data.associate);
        }
    }, [setCustomerAuthenticated])

    useEffect(() => {
        fetch("/api/proyectos/" + projectData.id + "/acceso", {
            credentials: "include",
        }).then(res => res.json())
            .then((data: TProjectCheckAccessResult) => {
                if (data.authorized) {
                    setCustomerData(data.associate);
                }
                setCustomerAuthenticated(data.authorized);
            }).catch(err => {
                console.error(err);
            });
    }, []);

    return (
        <div className="max-w-md mx-auto space-y-6 lg:space-y-12">
            <Button
                className="w-full bg-sbr-green text-on-primary text-lg sm:text-xl font-bold sm:py-6"
                variant="ghost"
                size="lg"
                onClick={() => setOpen(state => !state)}
            >
                Soy socio
            </Button>
            <AnimatePresence>
                {
                    open && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="bg-surface-container-lowest text-gray-800 rounded-lg p-3 sm:p-6 space-y-3 overflow-hidden"
                        >
                            {
                                customerAuthenticated
                                    ? <ProjectAssociatesDocumentListing projectData={projectData} customerData={customerData as TProjectAssociate} />
                                    : <ProjectAssociatesAuthenticationForm
                                        projectData={projectData}
                                        onAuthenticate={onAuthenticate}
                                    />
                            }
                        </motion.div>
                    )
                }
            </AnimatePresence>
        </div>
    );
}

function ProjectAssociatesDocumentListing({ customerData, projectData }: { customerData: TProjectAssociate, projectData: TProject }) {
    const { data, status } = useQuery(getProjectDocsOpts(projectData.id));

    if (status === "pending") {
        return (
            <div className="flex flex-col items-center justify-center gap-6 py-24 px-6 text-center">
                <span className="loader"></span>
                <p className="text-xl font-bold text-muted-foreground">Cargando documentos...</p>
            </div>
        );
    }

    if (status === "error" || !data) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
                <CircleX className="size-32 fill-destructive text-gray-50" />
                <p className="text-xl font-bold text-muted-foreground">Ocurrió un error al cargar los documentos</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="space-y-1.5">
                <h4 className="text-lg font-bold">Listado de documentos</h4>
                <p className="text-sm text-muted-foreground">
                    Bienvenido {customerData.name}.
                </p>
                <p className="text-sm text-muted-foreground">
                    Aquí puedes ver los documentos relacionados al proyecto como asambleas, comprobantes, recibos, etc.
                </p>
            </div>

            {!data.docs || data.docs.length === 0
                ? (
                    <p className="text-center font-semibold p-6">Aún no hay documentos disponibles para este proyecto.</p>
                )
                : <ProjectAssociatesDocumentCarousel docs={data.docs} />
            }
        </div>
    );
}

function ProjectAssociatesDocumentCarousel({ docs }: { docs: TProjectDoc[] }) {
    return (
        <Carousel>
            <CarouselContent className="pl-4">
                {docs.map((doc) => (
                    <CarouselItem className="relative z-0 aspect-[4/3] basis-2/3 bg-gray-200 rounded-lg" key={doc.id}>
                        <a className="inline-flex" target="_blank" href={`/static/uploads/${doc.name}`}>
                            <div className="absolute inset-x-0 bottom-0 z-10 bg-gray-100 px-1 py-2">
                                <p className="text-xs font-bold">{doc.name}</p>
                            </div>
                        </a>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    );
}

export const AssociateAuthenticationSchema = z.object({
    projectId: z
        .string({ error: "El ID del proyecto es obligatorio" }),
    idcode: z
        .string({ error: "Debes ingresar un RFC o CURP" })
        .or(z.string().min(18, "La CURP ingresada es demasiado corta").max(18, "La CURP ingresada es demasiado larga"))
        .or(z.string().min(13, "El número de lote es demasiado corto").max(13, "El número de lote es demasiado largo")),
    lotNum: z
        .string({ error: "El número de lote es obligatorio" })
        .min(1, "El número de lote es obligatorio"),
    appleNum: z
        .string({ error: "El número de manzana es obligatorio" })
        .min(1, "El número de manzana es obligatorio"),
});

export type authAssociatesFormType = z.infer<typeof AssociateAuthenticationSchema>;

function ProjectAssociatesAuthenticationForm({ projectData, onAuthenticate }: {
    projectData: TProject,
    onAuthenticate?: (data: TProjectCheckAccessResult) => void
}) {
    const form = useForm({
        resolver: zodResolver(AssociateAuthenticationSchema),
        defaultValues: {
            projectId: projectData.id,
            idcode: "",
            lotNum: "",
            appleNum: "",
        },
    });
    const authenticateMut = useMutation({
        mutationFn: checkProjectAccess,
    });
    const onSubmit = (values: authAssociatesFormType) => {
        authenticateMut.mutate(values, {
            onSuccess: (data) => {
                toast.success("Se ha verificado su acceso");
                if (typeof onAuthenticate === "function") {
                    onAuthenticate(data);
                }
            },
            onError: err => {
                toast.error(err.message || "No se pudo verificar su acceso");
            },
        });
    }

    return (
        <>
            <h4 className="text-lg font-extrabold uppercase">Identificate</h4>
            <Form {...form}>
                <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit, console.log)}>
                    <FormField
                        control={form.control}
                        name="idcode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="sr-only">CURP o RFC</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        className="bg-gray-50"
                                        placeholder="CURP o RFC"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage className="px-0.5" />
                            </FormItem>
                        )}
                    />
                    <div className="flex items-center justify-between gap-3">
                        <FormField
                            control={form.control}
                            name="lotNum"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="sr-only">Lote</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            className="bg-gray-50"
                                            placeholder="Lote"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="px-0.5" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="appleNum"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="sr-only">Manzana</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            className="bg-gray-50"
                                            placeholder="Manzana"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="px-0.5" />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button
                        type="submit"
                        className="w-full bg-sbr-blue text-on-primary text-base mt-6"
                        variant="ghost"
                        size="lg"
                    >
                        Enviar
                    </Button>
                </form>
            </Form>
        </>
    );
};

function _ContactForm() {
    return (
        <section className="py-12 bg-surface-container-lowest relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-surface-container-low hidden lg:block"></div>
            <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-24">
                <div>
                    <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tighter mb-8">Comienza Tu Legado.</h2>
                    <p className="text-lg text-on-surface-variant/80 font-light mb-12">
                        Nuestros curadores están disponibles para visitas privadas y consultas de portafolio. Déjanos ayudarte a asegurar tu parte del Caribe Mexicano.
                    </p>
                    <div className="flex items-start gap-6 p-8 rounded-2xl bg-surface-container-low border border-outline-variant/30 shadow-lg">
                        <img
                            className="w-20 h-20 rounded-full object-cover border-4 border-white"
                            data-alt="Professional mature male real estate curator in a sharp business suit"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrOjQKcZ_h8YDg1yG1i2FfvqhvtoL2xtfmfsxUOWZ3lG7pSAIIzc6YNKr8m5qzkUSs8VRvhUBXnaxxZaoxGTNC3vlzqCYE8VkaRAAmkKu7Jdc3Kjp_0GrqQie6hmU4P-HPxAz74xXlgEDM5UFr24Q2rbm-eFWwB2pOCxXbrnFHqHV4nMPRLJCocSj8sbkW1oa3OZUNXqA3nM1Pi-q1kmx_j4LUo3jkoFZ7xor8A1_yMS-j3aowKt4y_u0J6Jvrj6Pwjgqna1Vv-NQ"
                        />
                        <div>
                            <p className="text-primary font-label text-xs uppercase tracking-[0.2em] mb-1">Curador Principal</p>
                            <p className="text-xl font-headline font-bold text-on-surface mb-1">Gibran Vargas</p>
                            <p className="text-on-surface-variant text-sm italic">"La arquitectura es una conversación entre la historia y el futuro. Hablemos de la tuya."</p>
                        </div>
                    </div>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-outline-variant/20 shadow-2xl">
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Nombre Completo</label>
                                <input className="w-full bg-surface-container-high/50 border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Juan Pérez" type="text" />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Correo Electrónico</label>
                                <input className="w-full bg-surface-container-high/50 border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="juan@example.com" type="email" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Nivel de Inversión</label>
                            <select className="w-full bg-surface-container-high/50 border-none rounded-lg p-4 focus:ring-2 focus:ring-primary/20 transition-all appearance-none">
                                <option>USD 250k - 500k</option>
                                <option>USD 500k - 1M</option>
                                <option>USD 1M+</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">Mensaje</label>
                            <textarea className="w-full bg-surface-container-high/50 border-none rounded-lg p-4 h-32 focus:ring-2 focus:ring-primary/20 transition-all" placeholder="Estoy interesado en los lotes maestros de la fase 01..."></textarea>
                        </div>
                        <button className="w-full signature-gradient text-white font-label font-bold py-5 rounded-lg uppercase tracking-[0.2em] shadow-lg hover:shadow-primary/20 transition-all" type="submit">
                            Solicitar Expediente Privado
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}
