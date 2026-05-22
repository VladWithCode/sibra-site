import { SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardBreadcrumbs } from "./breadcrumbs";

export function DashboardHeader() {
    return (
        <header className="flex flex-col gap-1.5 px-3 py-1.5">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="md:hidden" />
                <h1 className="basis-full text-2xl font-medium">Panel de Administración</h1>
            </div>
            <DashboardBreadcrumbs />
        </header>
    );
}
