import { PropertyCard } from '@/components/dashboard/propertyCard';
import { Button } from '@/components/ui/button';
import { getFeaturedPropertiesOpts, getPropertiesOpts } from '@/queries/properties';
import type { TPropertyListingResult } from '@/queries/type';
import { useQuery, type QueryStatus } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router'
import { CircleX } from 'lucide-react';

export const Route = createFileRoute('/panel/propiedades/')({
    component: RouteComponent,
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(getPropertiesOpts);
    },
})

function RouteComponent() {
    const { data, status } = useQuery(getPropertiesOpts);

    return (
        <main className="grid grid-rows-[auto_1fr] gap-y-3 p-2 px-4 overflow-x-hidden overflow-y-auto bg-gray-200">
            <div className="flex justify-between items-center gap-6">
                <div className="space-y-0.5">
                    <h2 className="text-xl font-semibold">Propiedades</h2>
                    <p className="text-current/60">Listado de propiedades</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="link" size="lg" asChild>
                        <Link to="/panel/propiedades/nueva" className="bg-sbr-blue text-primary-foreground shadow-lg hover:scale-105 active:scale-95">
                            <span>Crear propiedad</span>
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="grid grid-rows-[2.5rem_1fr] gap-1.5">
                <div className="flex items-center gap-3">
                    filtros
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(30rem,1fr))] gap-x-3 gap-y-6">
                    <PropertyGrid data={data} queryStatus={status} />
                </div>
            </div>
        </main>
    );
}

function PropertyGrid({ data, queryStatus }: { data: TPropertyListingResult | undefined, queryStatus: QueryStatus }) {
    switch (queryStatus) {
        case "pending":
            return (
                <div className="col-span-full flex flex-col items-center justify-center gap-4">
                    <span className="loader text-3xl w-24!"></span>
                    <span className="text-2xl text-current/60 font-medium">Cargando...</span>
                </div>
            );
        case "error":
            return (
                <div className="col-span-full flex flex-col items-center justify-center gap-3">
                    <CircleX className="size-40 fill-destructive text-gray-50" />
                    <p className="text-2xl text-current/60 font-semibold">Ocurrió un error</p>
                    <div className="mt-8">
                        <Button className="text-base" size="lg">Reintentar</Button>
                    </div>
                </div>
            );
        case "success":
            return (
                (data as TPropertyListingResult).properties.map((prop) => (
                    <PropertyCard propData={prop} key={prop.id} />
                ))
            );
    }
}
