import { PropertiesFilters } from '@/components/panel/properties/PropertiesFilters';
import { PropertiesHeader } from '@/components/panel/properties/PropertiesHeader';
import { PropertiesTable } from '@/components/panel/properties/PropertiesTable';
import { getPanelPropertyListingOpts } from '@/queries/properties';
import type { TPropertyFilters } from '@/queries/type';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import * as z from "zod/mini";
import { optionalParam, positiveIntParam } from "@/lib/searchParams";

const PanelPropertiesSearchSchema = z.object({
    q: optionalParam(z.string()),
    status: optionalParam(z.enum(['borrador', 'archivada', 'publicada', 'en_revision', 'vendida', 'no_disponible'])),
    propType: optionalParam(z.enum(['casa', 'apartamento', 'terreno'])),
    contract: optionalParam(z.enum(['venta', 'renta'])),
    page: positiveIntParam(),
    perPage: positiveIntParam(),
});

type PanelPropertiesSearch = z.infer<typeof PanelPropertiesSearchSchema>;

function toFilters(search: PanelPropertiesSearch): Partial<TPropertyFilters> {
    return {
        textSearch: search.q || undefined,
        status: search.status,
        propType: search.propType,
        contract: search.contract,
        page: search.page,
        perPage: search.perPage,
    };
}

export const Route = createFileRoute('/panel/propiedades/')({
    component: RouteComponent,
    validateSearch: (search) => PanelPropertiesSearchSchema.parse(search),
    loaderDeps: ({ search }) => toFilters(search),
    loader: async ({ context, deps }) => {
        await context.queryClient.ensureQueryData(getPanelPropertyListingOpts(deps));
    },
});

function RouteComponent() {
    const search = Route.useSearch();
    const filters = toFilters(search);
    const { data, isLoading } = useQuery(getPanelPropertyListingOpts(filters));

    const properties = data?.properties ?? [];
    const pagination = data?.pagination ?? {
        total: 0,
        page: 1,
        perPage: 10,
        hasNext: false,
        hasPrev: false,
    };

    return (
        <main className="p-4 sm:p-6 lg:p-8">
            <PropertiesHeader />
            <div className="mb-6">
                <PropertiesFilters
                    filters={{
                        q: search.q,
                        status: search.status,
                        propType: search.propType,
                        contract: search.contract,
                    }}
                />
            </div>
            <PropertiesTable
                properties={properties}
                pagination={pagination}
                isLoading={isLoading}
            />
        </main>
    );
}
