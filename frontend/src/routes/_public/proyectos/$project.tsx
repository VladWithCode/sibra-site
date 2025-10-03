import { ContactForm } from '@/components/contact/ContactForm';
import { ProjectCurve } from '@/components/icons/svgCurves';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { checkProjectAccess, getProjectBySlug, getProjectBySlugOpts, getProjectDocsOpts, getProjectOpts } from '@/queries/projects';
import { useGSAP } from '@gsap/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router'
import gsap from 'gsap';
import { CircleX, ImageIcon, StarIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type Ref } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import type { TProject, TProjectAssociate, TProjectCheckAccessData, TProjectCheckAccessResult, TProjectDoc } from '@/queries/type';
import { toast } from 'sonner';
import { PalapaIcon, PlaygroundIcon, PoolIcon } from '@/components/icons/icons';

export const Route = createFileRoute('/_public/proyectos/$project')({
    component: RouteComponent,
})

function RouteComponent() {
    const { project } = Route.useParams()
    const { data, status } = useQuery(getProjectBySlugOpts(project))
    const projectData = data?.project

    if (status === "pending") {
        return <ProjectLoading />
    }

    if (status === "error" || !projectData) {
        return <ProjectNotFound />
    }

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
                    } as React.CSSProperties} viewBox='0 45 1200 400' />
                </div>
                <div className="relative z-10 text-gray-50 px-6 pt-48 pb-8">
                    <h2 className="flex flex-col gap-0.5 text-2xl font-bold uppercase tracking-wide text-shadow-lg">
                        <span className="text-4xl">Terreno</span>
                        <span>en Oferta</span>
                    </h2>
                </div>
            </section>
            <section className="p-6 space-y-3">
                <h1 className="text-xl font-bold">Conoce {projectData.name}</h1>
                <p className="text-current/60 font-medium leading-tight">{projectData.description}</p>
            </section>
            <section className="p-6 space-y-3">
                <div className="space-y-1.5">
                    <div className="relative z-0">
                        <HouseClip />
                        <div className="aspect-[4/3] mx-auto" style={{ clipPath: 'url(#house-clip)' }} >
                            <img
                                src="/sample.webp"
                                alt={projectData.name}
                                className="w-full h-full object-cover object-center"
                            />
                        </div>
                    </div>
                    <h3 className="text-4xl text-center">Amenidades</h3>
                </div>
                <AmenitiesCarousel projectData={projectData} />
            </section>
            <section className="py-6 space-y-3">
                <h3 className="text-lg text-center font-semibold px-6">
                    ¿De dónde nace {projectData.name}?
                </h3>
                <ProjectGallery projectData={projectData} />
            </section>
            <section className="py-6 space-y-6">
                <h3 className="text-4xl text-center">Disponibilidad</h3>
                <div className="aspect-video">
                    <img src={"/static/uploads/" + projectData.availability_img} alt={projectData.name} className="w-full h-full object-contain object-center" />
                </div>
            </section>
            <section className="p-3">
                <div className="bg-gray-50 border-2 border-sbr-green rounded-lg text-gray-800 space-y-3 p-3">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold">Conoce el proyecto</h3>
                        <p className="text-sm text-muted-foreground">Agenda una cita para visitar el proyecto junto con un agente de SIBRA, quien te dará un tour y te brindara toda la información necesaria sobre los proyectos de SIBRA.</p>
                    </div>
                    <div className="rounded-b-lg">
                        <ContactForm viewDetail="complete" />
                    </div>
                    <div className="text-tiny text-muted-foreground">Toda visita es sin compromiso. Asesoría completamente gratis.</div>
                </div>
            </section>
            <section className="p-3">
                <div className="border-2 border-sbr-green rounded-lg p-3 space-y-6">
                    <div className="space-y-1">
                        <h3 className="text-xl font-bold">¿Ya eres socio?</h3>
                        <p className="text-sm font-medium text-current/60">
                            Si ya eres socio de SIBRA, puedes dar clic en el botón para obtener acceso a la documentación
                            y a las más recientes actualizaciones del proyecto.
                        </p>
                    </div>
                    <ProjectAssociates projectData={projectData} />
                    <p className="text-tiny text-current/80">*Únicamente informativo sobre procesos del desarrollo en cuestión.</p>
                </div>
            </section>
            <section className="relative z-0 space-y-6">
                <h3 className="text-xl font-bold text-center">Otros Proyectos de SIBRA</h3>
                <div className="grid grid-cols-1 auto-rows-auto">
                    {/* {projectsData.slice(0, 2).map((project) => ( */}
                    {/*     <Link to={`/proyectos/${project.slug}`} className="relative z-0" key={project.slug}> */}
                    {/*         <div className="absolute inset-0 z-0"> */}
                    {/*             <img src={"/" + project.main_img} alt={project.name} className="w-full h-full object-cover object-center brightness-75" /> */}
                    {/*         </div> */}
                    {/*         <div className="relative z-10 flex items-center justify-center gap-3 bg-gray-700/50 py-20 px-6"> */}
                    {/*             <h4 className="text-lg font-semibold">{project.name}</h4> */}
                    {/*         </div> */}
                    {/*     </Link> */}
                    {/* ))} */}
                </div>
            </section>
        </main>
    );
}

function ProjectLoading() {
    return (
        <main className="relative z-0 flex flex-col items-center justify-center gap-6 bg-gray-200 py-48 px-6">
            <h1 className="text-4xl font-bold text-center text-current/60">Cargando proyecto...</h1>
            <span className="loader"></span>
        </main>
    );
}

function ProjectNotFound() {
    return (
        <main className="relative z-0 bg-gray-200">
            <div className="absolute inset-0 z-0">
                <img src="/sample.webp" alt="" className="w-full h-full object-cover object-center brightness-80" />
            </div>
            <div className="relative z-10 flex flex-col gap-12 px-6 pt-24 pb-20 text-gray-50 bg-linear-to-b from-sbr-blue-dark/60 to-sbr-blue-light/60">
                <h1 className="flex flex-col gap-1.5 text-9xl text-current/80 font-[sans] font-bold text-center">
                    <span>404</span>
                    <span className="text-xl font-normal">Proyecto no encontrado</span>
                </h1>
                <p className="text-gray-50 font-semibold">
                    El proyecto que buscas no existe o ya no está disponible. Da clic en el botón de abajo para
                    volver a la lista de proyectos.
                </p>
                <Button className="mx-auto font-bold" variant="default" size="lg" asChild>
                    <Link to="/proyectos">Regresar a Proyectos</Link>
                </Button>
            </div>
        </main>
    )
}

function AmenitiesCarousel({ projectData }: { projectData: TProject }) {
    return (
        <Carousel opts={{
            loop: true,
            align: "center",
            slidesToScroll: "auto",
        }}>
            <CarouselContent className="py-8 px-4">
                {projectData.amenities.map((amenity) => (
                    <CarouselItem className="shrink-0 basis-1/3">
                        <div className="flex flex-col items-center justify-start gap-1.5 text-center" key={amenity.name}>
                            <div className="flex items-center justify-center w-4/5 aspect-square rounded-full bg-gray-50 p-3 text-sbr-blue">
                                <AmenityIcon icon={amenity.icon} />
                            </div>
                            <p className="text">{amenity.name}</p>
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
    const className = "size-4/5";
    switch (icon) {
        case "pool":
            return <PoolIcon className={className} />;
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
                className="w-full bg-sbr-green text-lg font-bold"
                variant="ghost"
                size="lg"
                onClick={() => setOpen(state => !state)}
            >
                Soy socio
            </Button>
            <div className="h-0 overflow-hidden text-gray-800" ref={contentRef as Ref<HTMLDivElement>}>
                <div className="bg-gray-50 rounded-lg p-3 space-y-6">
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
