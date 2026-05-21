import { TeamHeader } from '@/components/panel/team/TeamHeader';
import { TeamTable } from '@/components/panel/team/TeamTable';
import { getTeamMembersOpts } from '@/queries/team';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'motion/react';

export const Route = createFileRoute('/panel/equipo/')({
    component: RouteComponent,
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(getTeamMembersOpts);
    },
});

const entrance = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
} as const;

function RouteComponent() {
    const teamMembers = useSuspenseQuery(getTeamMembersOpts).data ?? [];

    return (
        <div className="px-6">
            <motion.div {...entrance}>
                <TeamHeader />
            </motion.div>
            <motion.div {...entrance} transition={{ delay: 0.1 }} className="mt-6">
                <TeamTable teamMembers={teamMembers} isLoading={false} />
            </motion.div>
        </div>
    );
}
