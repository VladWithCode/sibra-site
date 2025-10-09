import { DashboardHeader } from "../dashboard/header";
import { DashboardSidebar } from "../dashboard/sidebar";
import { SidebarInset } from "../ui/sidebar";

export function DashboardLayout({ children }: React.PropsWithChildren) {
    return (
        <>
            <DashboardSidebar />
            <SidebarInset>
                <div
                    id="main-content"
                    className="relative h-screen w-screen grid grid-cols-1 grid-rows-[auto_1fr_auto] z-0 bg-gray-50 overflow-x-hidden overflow-y-auto"
                >
                    <DashboardHeader />
                    {children}
                </div>
            </SidebarInset>
        </>
    );
}
