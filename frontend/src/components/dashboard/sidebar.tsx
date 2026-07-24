import { Link, linkOptions } from "@tanstack/react-router";
import {
    BarChart3,
    Calendar,
    ChevronRight,
    Home,
    LayoutDashboard,
    Map,
    Newspaper,
    Sparkles,
    Tag,
    User,
    UserCircle,
    Users,
    Award,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
} from "../ui/sidebar";

const sidebarMenuItems = linkOptions([
    { label: "Panel", to: "/panel", icon: LayoutDashboard },
    { label: "Propiedades", to: "/panel/propiedades", icon: Home },
    { label: "Destacados", to: "/panel/destacados", icon: Sparkles },
    { label: "Terrenos y proyectos", to: "/panel/proyectos", icon: Map },
    { label: "Páginas de venta", to: "/panel/terrenos", icon: Tag },
    { label: "Asociados", to: "/panel/asociados", icon: Users },
    { label: "Citas y contacto", to: "/panel/citas", icon: Calendar },
    { label: "Blog", to: "/panel/blog", icon: Newspaper },
    { label: "Equipo", to: "/panel/equipo", icon: Award },
    { label: "Analíticas", to: "/panel/analiticas", icon: BarChart3 },
    { label: "Usuarios", to: "/panel/usuarios", icon: User },
    { label: "Mi perfil", to: "/panel/perfil", icon: UserCircle },
]);

export function DashboardSidebar() {
    return (
        <Sidebar
            variant="inset"
            collapsible="icon"
            className="bg-sbr-blue-dark text-white border-black/10"
            style={
                {
                    "--sidebar": "var(--color-sbr-blue-dark)",
                    "--sidebar-foreground": "white",
                    "--sidebar-accent": "var(--color-sbr-blue-light)",
                    "--sidebar-accent-foreground": "white",
                    "--sidebar-border": "rgba(255,255,255,0.1)",
                } as React.CSSProperties
            }
        >
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 shrink-0 rounded-md bg-white/15 grid place-items-center text-xs font-bold tracking-tight group-data-[collapsible=icon]:hidden">
                        SI
                    </div>
                    <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                        <div className="text-sm font-semibold leading-tight truncate">
                            Sibra Inmobiliaria
                        </div>
                        <div className="text-[11px] text-white/55 leading-tight">
                            Panel admin
                        </div>
                    </div>
                    <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:ml-0 text-white/60 hover:bg-white/10 hover:text-white" />
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-white/45">Navegación</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {sidebarMenuItems.map((item) => (
                                <SidebarMenuItem key={item.label}>
                                    <SidebarMenuButton asChild tooltip={item.label}>
                                        <Link
                                            to={item.to}
                                            activeOptions={{ exact: item.to === "/panel" }}
                                            className="text-white/75 hover:text-white [&.active]:bg-sbr-blue-light [&.active]:text-white [&.active]:font-medium"
                                        >
                                            <item.icon />
                                            <span>{item.label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="hover:bg-white/10">
                            <div className="h-8 w-8 shrink-0 rounded-full bg-sbr-green text-white grid place-items-center text-xs font-semibold">
                                JR
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium truncate">
                                    Julia Ramírez
                                </div>
                                <div className="text-[11px] text-white/55 truncate">
                                    admin@sibra.do
                                </div>
                            </div>
                            <ChevronRight size={14} className="text-white/50" />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
