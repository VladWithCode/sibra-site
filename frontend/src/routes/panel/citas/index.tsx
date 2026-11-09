import { RequestsFilters } from '@/components/panel/requests/RequestsFilters';
import { RequestsHeader } from '@/components/panel/requests/RequestsHeader';
import { RequestsTable } from '@/components/panel/requests/RequestsTable';
import { getQuotesOpts } from '@/queries/quotes';
import type { TQuoteFilters } from '@/queries/type';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'motion/react';
import * as z from "zod/mini";
import { optionalParam, positiveIntParam } from "@/lib/searchParams";

const PanelRequestsSearchSchema = z.object({
    name: optionalParam(z.string()),
    phone: optionalParam(z.string()),
    type: optionalParam(z.enum(['informacion', 'cita', 'venta', 'precalificacion', 'proyecto'])),
    status: optionalParam(z.enum(['pendiente', 'atendida', 'confirmada', 'volver a atender'])),
    scheduledDate: optionalParam(z.string()),
    createdAt: optionalParam(z.string()),
    page: positiveIntParam(),
    perPage: positiveIntParam(),
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
        <div className="px-6">
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
        </div>
    );
}
