import { Link, linkOptions } from "@tanstack/react-router";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger } from "../ui/sidebar";
import { Collapsible } from "@radix-ui/react-collapsible";

export function DashboardSidebar() {
    return (
        <Sidebar variant="inset">
            <SidebarHeader>
                <div className="flex items-center gap-3 text-current/80">
                    <SidebarTrigger />
                    <h2 className="text-lg font-semibold">Sibra Inmobiliaria</h2>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarGroupLabel>Navegación</SidebarGroupLabel>
                        <SidebarMenu>
                            {sidebarMenuItems.map((item) => (
                                <SidebarMenuItem key={item.label}>
                                    <SidebarMenuButton asChild>
                                        <Link
                                            className="text-current/80 hover:text-sbr-blue-light py-5 data-[status=active]:text-gray-50 data-[status=active]:font-medium data-[status=active]:bg-sbr-blue-light"
                                            to={item.to}
                                        >
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
                <SidebarGroup>
                    <SidebarGroupContent>
                        <Collapsible>
                        </Collapsible>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarFooter>
        </Sidebar>
    );
}

const sidebarMenuItems = linkOptions([
    {
        label: "Panel",
        to: "/panel",
    },
    {
        label: "Propiedades",
        to: "/panel/propiedades",
    },
    {
        label: "Terrenos y proyectos",
        to: "/panel/proyectos",
    },
    {
        label: "Citas y contacto",
        to: "/panel/citas",
    },
]);
