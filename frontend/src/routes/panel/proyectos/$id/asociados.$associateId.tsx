import { ComingSoon } from '@/components/ComingSoon';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
    '/panel/proyectos/$id/asociados/$associateId',
)({
    component: () => <ComingSoon message="Editar asociado estara disponible pronto." />,
});
