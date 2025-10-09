import { SidebarTrigger } from "../ui/sidebar";

export function DashboardHeader() {
    return (
        <header className="flex items-center gap-3 px-3 py-1.5">
            <div className="flex justify-center basis-auto shrink-0">
                <SidebarTrigger className="text-current/60" />
            </div>
            <h1 className="basis-full text-2xl font-medium">Panel de Administración</h1>
        </header>
    );
}
