import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/queries/queryClient'
import { SidebarProvider } from '@/components/ui/sidebar'
import type { IRouteContext } from './-routeContext'

export const Route = createRootRouteWithContext<IRouteContext>()({
    component: () => (
        <QueryClientProvider client={queryClient}>
            <SidebarProvider>
                <Outlet />
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
})
