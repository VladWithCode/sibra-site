import { AssociatesHeader } from '@/components/panel/associates/AssociatesHeader';
import { AssociatesTable } from '@/components/panel/associates/AssociatesTable';
import { getProjectAssociateByDataOpts, getProjectAssociatesOpts, getProjectOpts } from '@/queries/projects';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import * as z from "zod/mini";
import { optionalParam } from "@/lib/searchParams";

const AssociatesSearchSchema = z.object({
    pendingPayment: optionalParam(z.boolean()),
    lotNum: optionalParam(z.string()),
    appleNum: optionalParam(z.string()),
    rfcOrCurp: optionalParam(z.string()),
    name: optionalParam(z.string()),
    phone: optionalParam(z.string()),
});

export const Route = createFileRoute('/panel/proyectos/$id/asociados/')({
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
            <AssociatesTable
                associates={associates}
                projectId={id}
            />
        </main>
    );
}
