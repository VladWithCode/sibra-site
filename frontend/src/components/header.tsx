import { Heart, Home, LucideX, User } from "lucide-react";
import { Button } from "./ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger } from "./ui/navigation-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar } from "./ui/sidebar";
import { HomeIcon, Infonavit, ProjectsIcon } from "./icons/icons";
import { Link, linkOptions } from "@tanstack/react-router";

export function Header() {
    return (
        <header className="absolute top-0 inset-x-0 z-10 bg-sbr-blue-dark/0 px-2 py-4">
            <div className="flex items-center justify-between gap-6 text-gray-50 px-1">
                <div className="flex-auto grow-0">
                    <div className="xl:hidden">
                        <SidebarTrigger />
                    </div>
                    <div className="hidden xl:block">
                        <HeaderNavigationMenu />
                    </div>
                </div>
                <div className="flex-auto hidden"></div>
                <div className="flex-auto grow-0">
                    <img src="/sibra_logo_white_256.webp" alt="Sibra logo" className="h-8 w-auto" />
                </div>
            </div>
        </header>
    );
}

export function HeaderNavigationMenu() {
    return (
        <NavigationMenu viewport={false}>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger>Inicio</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <p>Inicio</p>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}

export function HeaderSidebar() {
    const { toggleSidebar } = useSidebar()
    return (
        <Sidebar collapsible="offcanvas">
            <SidebarHeader className="bg-gray-200">
                <div className="flex items-center justify-between gap-6 text-gray-700">
                    <div className="flex-auto grow-0">
                        <img src="/sibra_logo_white_256.webp" alt="Sibra logo" className="h-8 brightness-30" />
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleSidebar()}
                    >
                        <LucideX className="size-6" strokeWidth={3} />
                    </Button>
                </div>
            </SidebarHeader>
            <SidebarContent className="bg-gray-200">
                <SidebarGroup className="bg-gray-50">
                    <SidebarGroupLabel>Navegación</SidebarGroupLabel>
                    <SidebarMenu className="gap-1">
                        {mainNavigationItems.map(item => (
                            <SidebarMenuItem key={item.label}>
                                <SidebarMenuButton asChild>
                                    <Link
                                        className="text-current/80 hover:text-sbr-blue-light py-5 data-[status=active]:bg-sbr-blue data-[status=active]:text-gray-50"
                                        to={item.to}
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
                        {secondaryNavigationItems.map(item => (
                            <SidebarMenuItem key={item.label}>
                                <SidebarMenuButton asChild>
                                    <Link
                                        className="text-current/60 hover:text-sbr-blue-light data-[status=active]:bg-gray-700 data-[status=active]:text-gray-50"
                                        to={item.to}
                                    >
                                        <span className="inline-block -my-2">{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="bg-gray-300">
                <Link to="/iniciar-sesion" className="flex items-center gap-3 text-gray-700">
                    <span className="bg-gray-100 p-2 rounded-full">
                        <User className="size-4" />
                    </span>
                    <span className="font-semibold text-sm">Iniciar sesión</span>
                </Link>
            </SidebarFooter>
        </Sidebar>
    );
}

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
        to: "/terrenos",
        icon: ProjectsIcon,
    },
    {
        label: "Créditos Infonavit",
        to: "/infonavit",
        icon: ({ }: { className: string }) => (<Infonavit className="size-4" />),
    },
]);

const secondaryNavigationItems = linkOptions([
    {
        label: "Terminos y condiciones",
        to: "/terminos-y-condiciones",
    },
    {
        label: "Política de privacidad",
        to: "/politica-de-privacidad",
    },
]);
