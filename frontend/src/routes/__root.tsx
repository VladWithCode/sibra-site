import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanstackDevtools } from '@tanstack/react-devtools'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/queries/queryClient'

export const Route = createRootRoute({
    component: () => (
        <QueryClientProvider client={queryClient}>
            <Outlet />
            <TanstackDevtools
                config={{
                    position: 'bottom-left',
                }}
                plugins={[
                    {
                        name: 'Tanstack Router',
                        render: <TanStackRouterDevtoolsPanel />,
                    },
                ]}
            />
        </QueryClientProvider>
    ),
})
