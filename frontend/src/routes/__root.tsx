import { HeadContent, Link, Outlet, createRootRouteWithContext, type ErrorComponentProps } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/queries/queryClient";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { IRouteContext } from "./-routeContext";
import { MapsAPIProvider } from "@/maps/component";
import { Toaster } from "@/components/ui/sonner";
import { useUIStore } from "@/stores/uiStore";
import { useEffect } from "react";
import { PublicLayout } from "@/components/layout/publicLayout";
import { Button } from "@/components/ui/button";

export const Route = createRootRouteWithContext<IRouteContext>()({
    component: () => (
        <QueryClientProvider client={queryClient}>
            <SidebarProvider defaultOpen={false}>
                <MapsAPIProvider>
                    <HeadContent />
                    <Outlet />
                </MapsAPIProvider>
                <Toaster />
            </SidebarProvider>
        </QueryClientProvider>
    ),
    errorComponent: GlobalErrorComponent,
    notFoundComponent: GlobalNotFound,
});

function GlobalNotFound() {
    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();

    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplementProps({ complementType: "none" });
    }, []);

    return (
        <SidebarProvider defaultOpen={false}>
            <PublicLayout>
                <main className="flex flex-col items-center justify-center gap-6 xl:gap-12 px-6 py-16 xl:py-36">
                    <div className="space-y-6">
                        <p className="text-9xl xl:text-[10rem] font-bold text-muted-foreground text-center">
                            404
                        </p>
                        <h1 className="text-2xl xl:text-3xl text-muted-foreground">La página que buscas no existe</h1>
                    </div>
                    <p className="xl:text-lg font-medium text-current/80">
                        Puedes volver al inicio dando click an botón de abajo.
                    </p>
                    <Button className="text-xl text-gray-50 font-semibold bg-sbr-blue" variant="link" asChild size="lg">
                        <Link to="/" className="py-6 px-12">Volver al inicio</Link>
                    </Button>
                </main>
            </PublicLayout>
        </SidebarProvider>
    );
}

function GlobalErrorComponent({ error }: ErrorComponentProps) {
    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();

    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplementProps({ complementType: "none" });

        console.error("unhandled error: ", error);
    }, []);

    return (
        <SidebarProvider defaultOpen={false}>
            <PublicLayout>
                <main className="flex flex-col items-center justify-center gap-6 xl:gap-12 px-6 py-16 xl:py-36">
                    <div className="space-y-6">
                        <p className="text-9xl xl:text-[10rem] font-bold text-muted-foreground text-center">
                            500
                        </p>
                        <h1 className="text-2xl xl:text-3xl text-muted-foreground">Ocurrió un error inesperado</h1>
                    </div>
                    <p className="xl:text-lg font-medium text-current/80">
                        Parece que algo salió mal. Puedes volver al inicio o contactar a soporte si el problema
                        persiste.
                    </p>
                    <Button className="text-xl text-gray-50 font-semibold bg-sbr-blue" variant="link" asChild size="lg">
                        <Link to="/" className="py-6 px-12">Volver al inicio</Link>
                    </Button>
                </main>
            </PublicLayout>
        </SidebarProvider>
    );
}
