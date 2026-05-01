import { UsersFilters } from '@/components/panel/users/UsersFilters';
import { UsersHeader } from '@/components/panel/users/UsersHeader';
import { UsersTable } from '@/components/panel/users/UsersTable';
import { getUsersOpts } from '@/queries/users';
import type { TUserFilters } from '@/queries/type';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'motion/react';
import { z } from 'zod';

const PanelUsersSearchSchema = z.object({
    search: z.string().optional().catch(undefined),
    role: z
        .enum(['admin', 'editor', 'user'])
        .optional()
        .catch(undefined),
    page: z.coerce.number().int().positive().optional().catch(undefined),
    perPage: z.coerce.number().int().positive().optional().catch(undefined),
});

type PanelUsersSearch = z.infer<typeof PanelUsersSearchSchema>;

function toFilters(search: PanelUsersSearch): Partial<TUserFilters> {
    return {
        search: search.search || undefined,
        role: search.role,
        page: search.page,
        perPage: search.perPage,
    };
}

export const Route = createFileRoute('/panel/usuarios/')({
    component: RouteComponent,
    validateSearch: (search) => PanelUsersSearchSchema.parse(search),
    loaderDeps: ({ search }) => toFilters(search),
    loader: async ({ context, deps }) => {
        await context.queryClient.ensureQueryData(getUsersOpts(deps));
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
    const { data } = useSuspenseQuery(getUsersOpts(filters));

    const users = data.users ?? [];
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
                <UsersHeader />
            </motion.div>
            <motion.div {...entrance} transition={{ delay: 0.1 }} className="mb-6">
                <UsersFilters
                    filters={{
                        search: search.search,
                        role: search.role,
                    }}
                />
            </motion.div>
            <motion.div {...entrance} transition={{ delay: 0.2 }}>
                <UsersTable
                    users={users}
                    pagination={pagination}
                />
            </motion.div>
        </div>
    );
}
