import { getPropertiesOpts } from '@/queries/properties';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/propiedades/_listing/$contract')({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        const { contract } = params
        const properties = await context.queryClient.ensureQueryData(getPropertiesOpts);
    },
})

function RouteComponent() {
    const { contract } = Route.useParams()
    return (
        <div className="">{contract}</div>
    );
}
