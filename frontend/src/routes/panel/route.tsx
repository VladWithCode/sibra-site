import { DashboardLayout } from '@/components/layout/dashboardLayout';
import { getProfileOpts } from '@/queries/auth';
import type { TUserProfileResult } from '@/queries/type';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/panel')({
    component: RouteComponent,
    beforeLoad: async ({ context, location }) => {
        let data: TUserProfileResult | null = null;
        try {
            data = await context.queryClient.ensureQueryData(getProfileOpts);
        } catch (e) {
            console.error(e);
        }
        if (data === null) {
            throw redirect({
                to: "/iniciar-sesion",
                search: {
                    redirect: location.href,
                },
            });
        }
    },
});

function RouteComponent() {
    return (
        <DashboardLayout>
            <Outlet />
        </DashboardLayout>
    )
}
