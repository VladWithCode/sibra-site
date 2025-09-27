import { Footer } from '@/components/footer';
import { Header, HeaderSidebar } from '@/components/header';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_public')({
    component: RouteComponent,
})

function RouteComponent() {
    const { headerFloating } = useUIStore();

    return (
        <>
            <div className="xl:hidden">
                <HeaderSidebar />
            </div>
            <div className={cn(
                "relative h-screen w-screen grid grid-cols-1 z-0 overflow-x-hidden overflow-y-auto",
                headerFloating ? "grid-rows-[1fr_auto]" : "grid-rows-[1fr_auto_1fr]"
            )}>
                <Header />
                <Outlet />
                <Footer />
            </div>
        </>
    );
}
