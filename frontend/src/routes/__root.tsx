import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/queries/queryClient";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { IRouteContext } from "./-routeContext";
import { MapsAPIProvider } from "@/maps/component";
import { Toaster } from "@/components/ui/sonner";

export const Route = createRootRouteWithContext<IRouteContext>()({
    component: () => (
        <QueryClientProvider client={queryClient}>
            <SidebarProvider defaultOpen={false}>
                <MapsAPIProvider>
                    <Outlet />
                </MapsAPIProvider>
                <Toaster />
                {/* <TanstackDevtools */}
                {/*     config={{ */}
                {/*         position: 'bottom-left', */}
                {/*     }} */}
                {/*     plugins={[ */}
                {/*         { */}
                {/*             name: 'Tanstack Router', */}
                {/*             render: <TanStackRouterDevtoolsPanel />, */}
                {/*         }, */}
                {/*     ]} */}
                {/* /> */}
            </SidebarProvider>
        </QueryClientProvider>
    ),
});
