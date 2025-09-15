import { Footer } from '@/components/footer';
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_public')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <div className="relative h-full w-screen grid grid-rows-[1fr_auto] z-0 overflow-x-hidden">
            <header className="absolute top-0 inset-x-0 h-10 bg-gray-300/0"></header>
            <Outlet />
            <Footer />
        </div>
    );
}
