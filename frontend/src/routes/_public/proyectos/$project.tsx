import { ContactForm } from '@/components/contact/ContactForm';
import { ProjectCurve } from '@/components/icons/svgCurves';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { checkProjectAccess, getProjectBySlugOpts, getProjectDocsOpts, getProjectsOpts } from '@/queries/projects';
import { useGSAP } from '@gsap/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router'
import gsap from 'gsap';
import { CircleX, ImageIcon, StarIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type Ref } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import type { TProject, TProjectAssociate, TProjectCheckAccessResult, TProjectDoc } from '@/queries/type';
import { toast } from 'sonner';
import { PalapaIcon, PlaygroundIcon, PoolIcon } from '@/components/icons/icons';
import { cn } from '@/lib/utils';

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
        <main className="bg-sbr-blue text-gray-50 space-y-6">
            <section className="relative z-0">
                <div className="absolute inset-0 z-0">
                    <img src={"/static/uploads/" + projectData.main_img} alt="" className="w-full h-full object-cover object-center brightness-75" />
                </div>
                <div className="absolute inset-0 z-0 flex items-end">
                    <ProjectCurve className="w-full" style={{
                        '--top-bg': 'var(--color-sbr-green-dark)',
                        '--bottom-bg': 'var(--color-sbr-green-light)',
                    } as React.CSSProperties} />
                </div>
                <div className="relative z-10 text-gray-50 px-6 pt-48 sm:pt-60 lg:pt-72 xl:pt-96 pb-8">
                    <h2 className="max-w-6xl flex flex-col gap-0.5 text-2xl sm:text-4xl 2xl:text-5xl font-bold uppercase tracking-wide text-shadow-lg mx-auto">
                        <span className="text-4xl sm:text-6xl 2xl:text-7xl">Terreno</span>
                        <span>en Oferta</span>
                    </h2>
                </div>
            </section>
            <section className="p-6 sm:pt-12 xl:py-24 2xl:pt-36 sm:px-8 xl:px-12">
                <div className="max-w-6xl space-y-3 2xl:space-y-6 mx-auto">
                    <h1 className="text-xl sm:text-3xl xl:text-4xl 2xl:text-5xl font-bold">Conoce {projectData.name}</h1>
                    <p className="2xl:text-lg text-current/60 font-medium leading-tight">{projectData.description}</p>
                </div>
            </section>
            <section className="p-6 sm:px-8 space-y-3">
                <div className="space-y-1.5 sm:space-y-6 xl:space-y-12">
                    <div className="relative z-0">
                        <HouseClip />
                        <div className="max-w-xl xl:max-w-2xl aspect-[4/3] mx-auto" style={{ clipPath: 'url(#house-clip)' }} >
                            <img
                                src="/sample.webp"
                                alt={projectData.name}
                                className="w-full h-full object-cover object-center"
                            />
                        </div>
                    </div>
                    <h3 className="text-3xl xl:text-4xl 2xl:text-5xl text-center">Amenidades</h3>
                </div>
                <AmenitiesCarousel projectData={projectData} />
            </section>
            <section className="py-6 sm:py-8 space-y-3 sm:space-y-8">
                <h3 className="text-lg sm:text-3xl xl:text-4xl text-center font-semibold px-6">
                    ¿De dónde nace {projectData.name}?
                </h3>
                <div className="max-w-6xl mx-auto xl:rounded-lg overflow-hidden">
                    <ProjectGallery projectData={projectData} />
                </div>
            </section>
            <section className="max-w-6xl py-6 sm:py-8 space-y-6 sm:space-y-8 mx-auto">
                <h3 className="text-4xl text-center">Disponibilidad</h3>
                {projectData.availability_img !== ""
                    ? (
                        <div className="aspect-video">
                            <img
                                src={"/static/uploads/" + projectData.availability_img}
                                alt={"Imagen del plano de disponibilidad del projecto " + projectData.name}
                                className="w-full h-full object-contain object-center"
                            />
                        </div>
                    ) : (
                        <div className="relative flex items-center justify-center w-full aspect-video px-6 py-12">
                            <p className="font-medium leading-tight text-center text-current/80">
                                Aún no se ha agregado la disponibilidad del proyecto.
                            </p>
                        </div>
                    )
                }
            </section>
            <section className="p-3 sm:px-8 sm:py-6">
                <div className="max-w-6xl bg-gray-50 border-2 border-sbr-green rounded-lg text-gray-800 space-y-3 p-3 sm:p-6 mx-auto">
                    <div className="space-y-1 sm:space-y-3">
                        <h3 className="text-xl sm:text-3xl font-bold">Conoce el proyecto</h3>
                        <p className="text-sm text-muted-foreground">Agenda una cita para visitar el proyecto junto con un agente de SIBRA, quien te dará un tour y te brindara toda la información necesaria sobre los proyectos de SIBRA.</p>
                    </div>
                    <div className="rounded-b-lg">
                        <ContactForm viewDetail="complete" />
                    </div>
                    <div className="text-tiny text-muted-foreground">Toda visita es sin compromiso. Asesoría completamente gratis.</div>
                </div>
            </section>
            <section className="p-3 sm:px-8 sm:py-6">
                <div className="max-w-6xl border-2 border-sbr-green rounded-lg p-3 sm:p-6 space-y-6 mx-auto">
                    <div className="space-y-1 sm:space-y-3">
                        <h3 className="text-xl sm:text-3xl font-bold">¿Ya eres socio?</h3>
                        <p className="text-sm font-medium text-current/60">
                            Si ya eres socio de SIBRA, puedes dar clic en el botón para obtener acceso a la documentación
                            y a las más recientes actualizaciones del proyecto.
                        </p>
                    </div>
                    <ProjectAssociates projectData={projectData} />
                    <p className="text-tiny sm:text-sm text-current/80">*Únicamente informativo sobre procesos del desarrollo en cuestión.</p>
                </div>
            </section>
            <section className="relative z-0 space-y-6">
                <SimilarProjects projectData={projectData} />
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

function AmenitiesCarousel({ projectData }: { projectData: TProject }) {
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
        <Carousel opts={{
            loop: true,
            align: "center",
            slidesToScroll: "auto",
        }}>
            <CarouselContent className="py-8 lg:py-12 xl:py-24 px-4">
                {projectData.amenities.map((amenity) => (
                    <CarouselItem className="shrink-0 basis-1/3 lg:basis-1/4">
                        <div className="flex flex-col items-center justify-start gap-1.5 sm:gap-4 2xl:gap-8 text-center" key={amenity.name}>
                            <div className="flex items-center justify-center w-4/5 lg:w-3/4 xl:w-3/5 2xl:w-1/2 aspect-square rounded-full bg-gray-50 p-3 text-sbr-blue">
                                <AmenityIcon icon={amenity.icon} />
                            </div>
                            <p className="sm:text-lg 2xl:text-xl font-semibold">{amenity.name}</p>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselNext className="-right-5 bg-transparent" />
            <CarouselPrevious className="-left-5 bg-transparent" />
        </Carousel>
    );
}

type TAmenityIcon = "pool" | "playground" | "palapa" | "services" | string;

function AmenityIcon({ icon }: { icon: TAmenityIcon }) {
    const className = "size-4/5 lg:size-3/5 2xl:size-1/2";
    switch (icon) {
        case "pool":
            return <PoolIcon className={cn(className, "lg:size-3/4 2xl:size-2/3")} />;
        case "playground":
            return <PlaygroundIcon className={className} />;
        case "palapa":
            return <PalapaIcon className={className} />;
        // case "services":
        //     return <ServicesIcon className={className} />;
        default:
            return <StarIcon className={className} />;
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
            <div className="relative flex items-center justify-center w-full aspect-video text-gray-800 bg-gray-200 px-6 py-12">
                <p className="sm:text-lg font-medium leading-tight text-center text-current/80">
                    Aún no hay fotos de este proyecto
                </p>
            </div>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="relative aspect-video w-full h-auto p-0 group">
                    <div
                        className="absolute z-10 inset-0 flex items-center justify-center bg-sbr-blue/50 backdrop-blur-sm transition-opacity duration-300 opacity-0 group-hover:opacity-100 cursor-pointer data-[show-hint=true]:opacity-100"
                        data-show-hint={showHint}
                    >
                        <p className="flex items-center justify-center gap-3 text-xl font-semibold" data-show-hint={showHint}>
                            <ImageIcon className="size-8" />
                            Ver galería
                        </p>
                    </div>
                    <div className="relative w-full h-full z-0">
                        <img className="w-full h-full object-cover object-center" src={"/static/uploads/" + projectData.main_img} alt={projectData.name} />
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
    const contentRef = useRef<HTMLDivElement>(undefined);
    const [open, setOpen] = useState(false);
    const [customerAuthenticated, setCustomerAuthenticated] = useState(false);
    const [customerData, setCustomerData] = useState<TProjectAssociate | null>(null);
    const onAuthenticate = useCallback((data: TProjectCheckAccessResult) => {
        setCustomerAuthenticated(data.authorized);
        if (data.authorized) {
            setCustomerData(data.associate);
        }
    }, [setCustomerAuthenticated])

    const { contextSafe } = useGSAP({ scope: contentRef.current });
    const animateContent = contextSafe((isOpen: boolean) => {
        if (!contentRef.current) return;

        if (isOpen) {
            gsap.to(contentRef.current, {
                height: "auto",
                duration: 0.3,
                ease: "power1.inOut",
            });
        } else {
            gsap.to(contentRef.current, {
                height: 0,
                duration: 0.3,
                ease: "power1.inOut",
            });
        }
    })

    useEffect(() => {
        animateContent(open);
    }, [open]);

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
        <div className="space-y-3">
            <Button
                className="w-full bg-sbr-green text-lg sm:text-xl font-bold sm:py-6"
                variant="ghost"
                size="lg"
                onClick={() => setOpen(state => !state)}
            >
                Soy socio
            </Button>
            <div className="h-0 overflow-hidden text-gray-800" ref={contentRef as Ref<HTMLDivElement>}>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-6 space-y-6">
                    {
                        customerAuthenticated
                            ? <ProjectAssociatesDocumentListing projectData={projectData} customerData={customerData as TProjectAssociate} />
                            : <ProjectAssociatesAuthenticationForm
                                projectData={projectData}
                                onAuthenticate={onAuthenticate}
                            />
                    }
                </div>
            </div>
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
        <>
            <div className="space-y-6">
                <div className="space-y-1.5">
                    <h4 className="text-3xl font-bold">Listado de documentos</h4>
                    <p className="text-sm text-muted-foreground">
                        Bienvenido {customerData.name}.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Aquí puedes ver los documentos relacionados al proyecto como asambleas, comprobantes, recibos, etc.
                    </p>
                </div>

                {data.docs.length === 0
                    ? (
                        <p className="text-center font-semibold p-6">Aún no hay documentos disponibles para este proyecto.</p>
                    )
                    : <ProjectAssociatesDocumentCarousel docs={data.docs} />
                }
            </div>
        </>
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
            <h4 className="text-3xl font-bold">Identificate</h4>
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
                        className="w-full bg-sbr-green text-gray-50 text-base font-bold mt-6"
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

function HouseClip() {
    return (
        <svg className="h-0 w-0">
            <defs>
                <clipPath id="house-clip" clipPathUnits="objectBoundingBox">
                    <polygon
                        points="0,0.3 0.2,0.1 0.4,0.3 0.4,0.4 0.7,0.3 1,0.4 1,0.9 0,0.9"
                    />
                </clipPath>
            </defs>
        </svg>
    );
}
