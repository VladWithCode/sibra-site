import { RequestsFilters } from '@/components/panel/requests/RequestsFilters';
import { RequestsHeader } from '@/components/panel/requests/RequestsHeader';
import { RequestsTable } from '@/components/panel/requests/RequestsTable';
import { getQuotesOpts } from '@/queries/quotes';
import type { TQuoteFilters } from '@/queries/type';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { z } from 'zod';

const PanelRequestsSearchSchema = z.object({
    name: z.string().optional().catch(undefined),
    phone: z.string().optional().catch(undefined),
    type: z
        .enum(['informacion', 'cita', 'venta', 'precalificacion', 'proyecto'])
        .optional()
        .catch(undefined),
    status: z
        .enum(['pendiente', 'atendida', 'confirmada', 'volver a atender'])
        .optional()
        .catch(undefined),
    scheduledDate: z.string().optional().catch(undefined),
    createdAt: z.string().optional().catch(undefined),
    page: z.coerce.number().int().positive().optional().catch(undefined),
    perPage: z.coerce.number().int().positive().optional().catch(undefined),
});

type PanelRequestsSearch = z.infer<typeof PanelRequestsSearchSchema>;

function toFilters(search: PanelRequestsSearch): Partial<TQuoteFilters> {
    return {
        name: search.name || undefined,
        phone: search.phone || undefined,
        type: search.type,
        status: search.status,
        scheduledDate: search.scheduledDate,
        createdAt: search.createdAt,
        page: search.page,
        perPage: search.perPage,
    };
}

export const Route = createFileRoute('/panel/citas/')({
    component: RouteComponent,
    validateSearch: (search) => PanelRequestsSearchSchema.parse(search),
    loaderDeps: ({ search }) => toFilters(search),
    loader: async ({ context, deps }) => {
        await context.queryClient.ensureQueryData(getQuotesOpts(deps));
    },
});

const entrance = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
} as const;

function RouteComponent() {
    const search = Route.useSearch();
    const filters = toFilters(search);
    const { data } = useSuspenseQuery(getQuotesOpts(filters));

    const requests = data.requests ?? [];
    const pagination = data?.pagination ?? {
        total: 0,
        page: 1,
        perPage: 10,
        hasNext: false,
        hasPrev: false,
    };

    return (
        <main className="p-4 sm:p-6 lg:p-8">
            <motion.div {...entrance}>
                <RequestsHeader />
            </motion.div>
            <motion.div {...entrance} transition={{ delay: 0.1 }} className="mb-6">
                <RequestsFilters
                    filters={{
                        name: search.name,
                        phone: search.phone,
                        type: search.type,
                        status: search.status,
                        scheduledDate: search.scheduledDate,
                        createdAt: search.createdAt,
                    }}
                />
            </motion.div>
            <motion.div {...entrance} transition={{ delay: 0.2 }}>
                <RequestsTable
                    requests={requests}
                    pagination={pagination}
                />
            </motion.div>
        </main>
    );
}
