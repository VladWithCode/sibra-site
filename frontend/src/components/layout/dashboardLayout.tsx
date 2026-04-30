import { DashboardHeader } from "../dashboard/header";
import { DashboardSidebar } from "../dashboard/sidebar";
import { SidebarInset } from "../ui/sidebar";

export function DashboardLayout({ children }: React.PropsWithChildren) {
    return (
        <>
            <DashboardSidebar />
            <SidebarInset className="mb-0! mr-0! pb-6">
                <div
                    id="main-content"
                    className="relative h-full w-full grid grid-cols-1 grid-rows-[auto_1fr_auto] z-0 bg-gray-50 overflow-x-hidden overflow-y-auto space-y-3"
                >
                    <DashboardHeader />
                    {children}
                </div>
            </SidebarInset>
        </>
    );
}
