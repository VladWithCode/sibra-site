import { AssociatesHeader } from '@/components/panel/associates/AssociatesHeader';
import { AssociatesSearch } from '@/components/panel/associates/AssociatesSearch';
import { AssociatesTable } from '@/components/panel/associates/AssociatesTable';
import { getProjectAssociateByDataOpts, getProjectAssociatesOpts, getProjectOpts } from '@/queries/projects';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { z } from 'zod';

const AssociatesSearchSchema = z.object({
    pendingPayment: z.boolean().optional().catch(undefined),
    lotNum: z.string().optional().catch(undefined),
    appleNum: z.string().optional().catch(undefined),
    rfcOrCurp: z.string().optional().catch(undefined),
    name: z.string().optional().catch(undefined),
    phone: z.string().optional().catch(undefined),
});

export const Route = createFileRoute('/panel/proyectos/$id/asociados')({
    component: RouteComponent,
    validateSearch: (search) => AssociatesSearchSchema.parse(search),
    loaderDeps: ({ search }) => AssociatesSearchSchema.parse(search),
    loader: async ({ context, params, deps }) => {
        await Promise.all([
            context.queryClient.ensureQueryData(getProjectOpts(params.id)),
            context.queryClient.ensureQueryData(
                getProjectAssociateByDataOpts(params.id, deps),
            ),
        ]);
    },
});

function RouteComponent() {
    const { id } = Route.useParams();
    const search = Route.useSearch();

    const { data: projectData } = useSuspenseQuery(getProjectOpts(id));
    const { data: associates } = useSuspenseQuery(
        getProjectAssociatesOpts(id),
    );

    return (
        <main className="p-4 sm:p-6 lg:p-8">
            <AssociatesHeader
                projectId={id}
                projectName={projectData?.project?.name ?? 'Proyecto'}
            />
            {/* <div className="mb-6"> */}
            {/*     <AssociatesSearch  /> */}
            {/* </div> */}
            <AssociatesTable
                associates={associates}
                projectId={id}
            />
        </main>
    );
}
