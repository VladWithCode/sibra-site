import { Footer } from "@/components/footer";
import { Header, HeaderSidebar } from "@/components/header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { createFileRoute, Link, Outlet, type ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_public")({
    component: RouteComponent,
    errorComponent: GlobalErrorComponent,
});

function RouteComponent() {
    const { headerFloating } = useUIStore();

    return (
        <>
            <div className="xl:hidden">
                <HeaderSidebar />
            </div>
            <div
                id="main-content"
                className={cn(
                    "relative h-screen w-screen grid grid-cols-1 z-0 overflow-x-hidden overflow-y-auto",
                    headerFloating ? "grid-rows-[1fr_auto]" : "grid-rows-[1fr_auto_1fr]",
                )}
            >
                <Header />
                <Outlet />
                <Footer />
            </div>
        </>
    );
}

function GlobalErrorComponent({ error }: ErrorComponentProps) {
    const { headerFloating, setHeaderFloating, setHeaderComplementProps } = useUIStore();

    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplementProps({ complementType: "none" });

        console.error("unhandled error: ", error);
    }, []);

    return (
        <>
            <div className="xl:hidden">
                <HeaderSidebar />
            </div>
            <div
                id="main-content"
                className={cn(
                    "relative h-screen w-screen grid grid-cols-1 z-0 overflow-x-hidden overflow-y-auto",
                    headerFloating ? "grid-rows-[1fr_auto]" : "grid-rows-[1fr_auto_1fr]",
                )}
            >
                <Header />
                <main className="flex flex-col items-center justify-center gap-6 px-6 py-16">
                    <p className="text-9xl font-bold text-muted-foreground text-center">
                        500
                    </p>
                    <h1 className="text-2xl text-muted-foreground">Ocurrió un error inesperado</h1>
                    <p className="font-medium text-current/80">
                        Parece que algo salió mal. Puedes volver al inicio o contactar a soporte si el problema
                        persiste.
                    </p>
                    <Button className="text-xl text-gray-50 font-semibold bg-sbr-blue" variant="link" asChild size="lg">
                        <Link to="/" className="py-6 px-12">Volver al inicio</Link>
                    </Button>
                </main>
                <Footer />
            </div>
        </>
    );
}
