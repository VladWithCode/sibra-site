import { ComingSoon } from '@/components/ComingSoon';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/panel/proyectos/$id/asociados/nuevo')({
    component: () => <ComingSoon message="Crear asociado estara disponible pronto." />,
});
