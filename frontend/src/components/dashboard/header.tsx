import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader() {
    return (
        <header className="flex items-center gap-3 px-3 py-1.5">
            <SidebarTrigger className="md:hidden" />
            <h1 className="basis-full text-2xl font-medium">Panel de Administración</h1>
        </header>
    );
}
