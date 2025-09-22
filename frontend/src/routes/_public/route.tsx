import { Footer } from '@/components/footer';
import { Header, HeaderSidebar } from '@/components/header';
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_public')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <>
            <div className="xl:hidden">
                <HeaderSidebar />
            </div>
            <div className="relative h-screen w-screen grid grid-rows-[1fr_auto] z-0 overflow-x-hidden">
                <Header />
                <Outlet />
                <Footer />
            </div>
        </>
    );
}
