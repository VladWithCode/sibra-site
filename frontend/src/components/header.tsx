import { Heart, Home, LucideX } from "lucide-react";
import { Button } from "./ui/button";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "./ui/navigation-menu";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from "./ui/sidebar";
import { FilterIcon, HomeIcon, Infonavit, ProjectsIcon } from "./icons/icons";
import { Link, linkOptions } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { useUIStore, type THeaderComplementProps } from "@/stores/uiStore";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { Input } from "./ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";

export function Header() {
    const { headerFloating, headerComplementProps } = useUIStore();
    const header = useRef<HTMLDivElement>(null);
    const pageTop = useRef<HTMLDivElement>(null);
    const { contextSafe } = useGSAP({ scope: header, dependencies: [pageTop.current] });
    const animateHeader = contextSafe((isAtTop: boolean) => {
        if (!pageTop.current || !header.current) return;

        if (isAtTop) {
            gsap.to(header.current, {
                y: "-6rem",
                opacity: "0",
                duration: 0.5,
                ease: "power2.out",
                onComplete: () => {
                    gsap.set(header.current, { position: "" });
                },
            });
            gsap.to(
                header.current,
                // @ts-ignore
                {
                    y: "0rem",
                    opacity: "1",
                    backgroundColor: "",
                    duration: 0.5,
                    ease: "power2.out",
                },
                "-=0.4",
            );
        } else {
            gsap.set(header.current, {
                y: "-12rem",
                opacity: "0",
                position: "var(--position)",
            });
            gsap.to(header.current, {
                y: "0rem",
                opacity: "1",
                backgroundColor: "var(--bg-color)",
                duration: 0.5,
                ease: "power2.inOut",
            });
        }
    });
    useEffect(() => {
        if (!pageTop.current || !header.current) return;

        const obsv = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                animateHeader(entry.isIntersecting);
            });
        });
        obsv.observe(pageTop.current);

        return () => {
            obsv.disconnect();
        };
    }, []);

    return (
        <>
            <div
                className="col-start-1 col-span-1 absolute top-[60%] inset-x-0 z-0 h-0"
                ref={pageTop}
                data-page-top
            ></div>
            <header
                className={cn(
                    "col-start-1 col-span-1 top-0 inset-x-0 -translate-y-24 z-10 bg-sbr-blue-dark/0 px-2 lg:px-8 py-1.5 lg:py-2 data-[inView=false]:sticky",
                    !headerFloating
                        ? "relative bg-top-normal data-[in-view=false]:bg-top-normal shadow-sm"
                        : "absolute data-[inView=false]:bg-top-floating",
                )}
                ref={header}
                style={
                    {
                        "--bg-color": headerFloating
                            ? "var(--color-scrolled-floating)"
                            : "var(--color-scrolled-normal)",
                        "--position": headerFloating ? "fixed" : "sticky",
                    } as React.CSSProperties
                }
            >
                <div className="max-w-6xl flex items-center justify-between gap-6 text-gray-50 mx-auto">
                    <SidebarTrigger
                        className="lg:hidden stroke-current data-[header-floating=false]:text-gray-800 my-auto"
                        data-header-floating={headerFloating}
                    />
                    <div className="hidden lg:block">
                        <HeaderNavigationMenu />
                    </div>
                    <HeaderComplement {...headerComplementProps} />
                    <Link
                        to="/"
                        className="flex-auto grow-0 data-[header-floating=false]:brightness-30"
                        data-header-floating={headerFloating}
                    >
                        <img
                            src="/sibra_logo_white_256.webp"
                            alt="Sibra logo"
                            className="h-8 lg:h-10 w-auto -mt-0.5"
                        />
                    </Link>
                </div>
            </header>
        </>
    );
}

export function HeaderComplement(props: THeaderComplementProps) {
    switch (props.complementType) {
        case "search":
            return <HeaderComplementSearch />;
        case "cta":
            return <HeaderComplementCta />;
        case "project":
            return <HeaderComplementProject {...props} />;
        case "none":
        default:
            return null;
    }
}

const propertyListingFilterFormSchema = z.object({
    search: z.string().optional(),
    price: z.number().gte(0, { message: "El precio debe ser un número positivo" }).optional(),
    minPrice: z
        .number()
        .gte(0, { message: "El precio mínimo debe ser un número positivo" })
        .optional(),
    maxPrice: z
        .number()
        .gte(0, { message: "El precio máximo debe ser un número positivo" })
        .optional(),
    sqMt: z
        .number()
        .gte(0, { message: "El área de más menos debe ser un número positivo" })
        .optional(),
    lotSize: z
        .number()
        .gte(0, { message: "El tamaño del lote debe ser un número positivo" })
        .optional(),
    yearBuilt: z.number().optional(),
    contract: z.string().optional(),
    propType: z.string().optional(),
    zip: z.string().optional(),
    nbHood: z.string().optional(),
    status: z.string().optional(),
    minBedrooms: z.number().optional(),
    maxBedrooms: z.number().optional(),
    minBathrooms: z.number().optional(),
    maxBathrooms: z.number().optional(),
    minSqMt: z.number().optional(),
    maxSqMt: z.number().optional(),
    orderBy: z.string().default("listing_date").optional(),
    orderDirection: z.string().default("desc").optional(),
});

export type formSchemaType = z.infer<typeof propertyListingFilterFormSchema>;

function HeaderComplementSearch() {
    const form = useForm<formSchemaType>({
        resolver: zodResolver(propertyListingFilterFormSchema),
        defaultValues: {
            search: "",
            price: 0,
            minPrice: 0,
            maxPrice: 0,
            sqMt: 0,
            lotSize: 0,
            yearBuilt: 0,
            contract: "",
            propType: "",
            zip: "",
            nbHood: "",
            status: "publicada",
            minBedrooms: 0,
            maxBedrooms: 0,
            minBathrooms: 0,
            maxBathrooms: 0,
            minSqMt: 0,
            maxSqMt: 0,
            orderBy: "listing_date",
            orderDirection: "DESC",
        },
    });

    const onSearchSubmit = (data: formSchemaType) => {
        console.log(data);
    };

    return (
        <Form {...form}>
            <form
                className="space-y-8 text-gray-800"
                onSubmit={form.handleSubmit(onSearchSubmit)}
            >
                <Dialog>
                    <div className="relative flex">
                        <FormField
                            control={form.control}
                            name="search"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            type="search"
                                            className="bg-gray-50"
                                            placeholder="Buscar..."
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <DialogTrigger asChild>
                            <Button variant="ghost">
                                <FilterIcon className="text-gray-400 size-4" />
                            </Button>
                        </DialogTrigger>
                    </div>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Filtrar por</DialogTitle>
                            <DialogDescription>
                                Filtra las propiedades para que se ajusten a tus necesidades.
                            </DialogDescription>
                        </DialogHeader>
                        <FormField
                            control={form.control}
                            name="search"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Buscar</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="search"
                                            className="bg-gray-50"
                                            placeholder="Buscar..."
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <div className="flex gap-3">
                            <FormField
                                control={form.control}
                                name="minPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio Mínimo</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                className="bg-gray-50"
                                                placeholder="Precio mínimo"
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maxPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio Máximo</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                className="bg-gray-50"
                                                placeholder="Precio máximo"
                                                {...field}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <FormField
                                    control={form.control}
                                    name="minSqMt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>M² mínimo</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    className="bg-gray-50"
                                                    placeholder="M² mínimo"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="maxSqMt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>M² máximo</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    className="bg-gray-50"
                                                    placeholder="M² máximo"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex gap-3">
                                <FormField
                                    control={form.control}
                                    name="minBedrooms"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Habitaciones Mínimas</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    className="bg-gray-50"
                                                    placeholder="Habitaciones mínimas"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="maxBedrooms"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Habitaciones Máximas</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    className="bg-gray-50"
                                                    placeholder="Habitaciones máximas"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex-row justify-end gap-3">
                            <Button type="button" className="basis-30" variant="ghost">
                                Limpiar
                            </Button>
                            <Button type="submit" className="basis-30" variant="default">
                                Aplicar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </form>
        </Form>
    );
}

function HeaderComplementCta() {
    return (
        <div className="flex-auto">
            <Button variant="ghost" asChild>
                <Link to="/vender" className="bg-sbr-blue text-gray-50 py-1! h-min">
                    Vende tu casa
                </Link>
            </Button>
        </div>
    );
}

function HeaderComplementProject({ projectName }: { projectName: string }) {
    return (
        <div className="flex-auto">
            <h2 className="text-lg font-semibold">{projectName}</h2>
        </div>
    )
}

export function HeaderNavigationMenu() {
    const { headerFloating } = useUIStore();

    return (
        <NavigationMenu viewport={false}>
            <NavigationMenuList className="bg-transparent">
                {desktopNavigationItems.map((item) => (
                    <NavigationMenuItem key={item.label}>
                        <HeaderNavigationMenuLink item={item} headerFloating={headerFloating} />
                    </NavigationMenuItem>
                ))}
            </NavigationMenuList>
        </NavigationMenu>
    );
}

function HeaderNavigationMenuLink({ item, headerFloating }: {
    item: typeof desktopNavigationItems[number];
    headerFloating: boolean;
}) {
    const [styleVal, setStyleVal] = useState<React.CSSProperties>({});

    useEffect(() => {
        if (headerFloating) {
            setStyleVal({
                "--base-color": "var(--color-gray-50)",
                "--base-fwg": "500",
                "--active-color": "var(--color-gray-800)",
                "--active-bg": "var(--color-gray-100)",
                "--active-fwg": "500",
            } as React.CSSProperties);
        } else {
            setStyleVal({
                "--base-color": "var(--color-gray-800)",
                "--base-fwg": "400",
                "--active-color": "var(--color-gray-50)",
                "--active-bg": "var(--color-sbr-blue-light)",
                "--active-fwg": "500",
            } as React.CSSProperties);
        }
    }, [headerFloating]);

    return (
        <NavigationMenuLink asChild>
            <Link
                className="text-base text-(--base-color) font-(--base-fwg) data-[status=active]:text-(--active-color) data-[status=active]:font-(--active-fwg) data-[status=active]:bg-(--active-bg) transition-colors duration-300"
                to={item.to}
                style={styleVal}
            >
                {item.label}
            </Link>
        </NavigationMenuLink>
    );
}

export function HeaderSidebar() {
    const { toggleSidebar } = useSidebar();
    const onLinkClick = useCallback(() => {
        toggleSidebar();
        window.scrollY = 0;
    }, [toggleSidebar]);

    return (
        <Sidebar collapsible="offcanvas">
            <SidebarHeader className="bg-gray-200">
                <div className="flex items-center justify-between gap-6 text-gray-700">
                    <div className="flex-auto grow-0">
                        <img
                            src="/sibra_logo_white_256.webp"
                            alt="Sibra logo"
                            className="h-8 brightness-30"
                        />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => toggleSidebar()}>
                        <LucideX className="size-6" strokeWidth={3} />
                    </Button>
                </div>
            </SidebarHeader>
            <SidebarContent className="bg-gray-200">
                <SidebarGroup className="bg-gray-50">
                    <SidebarGroupLabel>Navegación</SidebarGroupLabel>
                    <SidebarMenu className="gap-1">
                        {mainNavigationItems.map((item) => (
                            <SidebarMenuItem key={item.label}>
                                <SidebarMenuButton asChild>
                                    <Link
                                        className="text-current/80 hover:text-sbr-blue-light py-5 data-[status=active]:bg-sbr-blue data-[status=active]:text-gray-50"
                                        to={item.to}
                                        onClick={onLinkClick}
                                    >
                                        <item.icon className="size-6" />
                                        <span>{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup className="mt-auto">
                    <SidebarMenu>
                        {secondaryNavigationItems.map((item) => (
                            <SidebarMenuItem key={item.label}>
                                <SidebarMenuButton asChild>
                                    <Link
                                        className="text-current/60 hover:text-sbr-blue-light data-[status=active]:bg-gray-700 data-[status=active]:text-gray-50"
                                        to={item.to}
                                        onClick={onLinkClick}
                                    >
                                        <span className="inline-block -my-2">{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            {/* <SidebarFooter className="bg-gray-300"> */}
            {/*     <Link to="/iniciar-sesion" className="flex items-center gap-3 text-gray-700"> */}
            {/*         <span className="bg-gray-100 p-2 rounded-full"> */}
            {/*             <User className="size-4" /> */}
            {/*         </span> */}
            {/*         <span className="font-semibold text-sm">Iniciar sesión</span> */}
            {/*     </Link> */}
            {/* </SidebarFooter> */}
        </Sidebar>
    );
}

const desktopNavigationItems = linkOptions([
    {
        label: "Inicio",
        to: "/",
    },
    {
        label: "Propiedades en Venta",
        to: "/propiedades",
    },
    {
        label: "Terrenos y proyectos",
        to: "/proyectos",
    },
    {
        label: "Contacto",
        to: "/contacto",
    },
]);

const mainNavigationItems = linkOptions([
    {
        label: "Inicio",
        to: "/",
        icon: Home,
    },
    {
        label: "Propiedades Guardadas",
        to: "/favoritos",
        icon: Heart,
    },
    {
        label: "Propiedades en Venta",
        to: "/propiedades",
        icon: HomeIcon,
    },
    {
        label: "Terrenos y proyectos",
        to: "/proyectos",
        icon: ProjectsIcon,
    },
    {
        label: "Créditos Infonavit",
        to: "#",
        icon: ({ }: { className: string }) => <Infonavit className="size-4" />,
    },
]);

const secondaryNavigationItems = linkOptions([
    {
        label: "Contacto",
        to: "/contacto",
    },
    {
        label: "Acerca de Nosotros",
        to: "/nosotros",
    },
    {
        label: "Terminos y condiciones",
        to: "/terminos-y-condiciones",
    },
    {
        label: "Política de privacidad",
        to: "/politica-de-privacidad",
    },
]);
