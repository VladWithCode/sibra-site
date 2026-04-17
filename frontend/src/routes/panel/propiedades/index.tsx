import { PropertiesFilters } from '@/components/panel/properties/PropertiesFilters';
import { PropertiesHeader } from '@/components/panel/properties/PropertiesHeader';
import { PropertiesTable } from '@/components/panel/properties/PropertiesTable';
import { getPropertyFilteredListingOpts } from '@/queries/properties';
import type { TPropertyFilters } from '@/queries/type';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

const PanelPropertiesSearchSchema = z.object({
    q: z.string().optional().catch(undefined),
    status: z
        .enum(['borrador', 'archivada', 'publicada', 'en_revision', 'vendida', 'no_disponible'])
        .optional()
        .catch(undefined),
    propType: z.enum(['casa', 'apartamento', 'terreno']).optional().catch(undefined),
    contract: z.enum(['venta', 'renta']).optional().catch(undefined),
    page: z.coerce.number().int().positive().optional().catch(undefined),
    perPage: z.coerce.number().int().positive().optional().catch(undefined),
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
        await context.queryClient.ensureQueryData(getPropertyFilteredListingOpts(deps));
    },
});

function RouteComponent() {
    const search = Route.useSearch();
    const filters = toFilters(search);
    const { data, isLoading } = useQuery(getPropertyFilteredListingOpts(filters));

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
