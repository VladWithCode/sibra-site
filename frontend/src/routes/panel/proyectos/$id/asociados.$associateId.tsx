import { ComingSoon } from '@/components/ComingSoon';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
    '/panel/proyectos/$id/asociados/$associateId',
)({
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <main className="p-4 sm:p-6 lg:p-8">
            <ComingSoon message="Editar asociado estara disponible pronto." />
        </main>
    );
}
