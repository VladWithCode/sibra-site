import { ComingSoon } from '@/components/ComingSoon';
import { useUIStore } from '@/stores/uiStore';
import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react';

export const Route = createFileRoute('/_public/precalificaciones')({
    component: RouteComponent,
})

function RouteComponent() {
    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();

    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplementProps({ complementType: "none" });
    }, [])

    return (
        <main>
            <ComingSoon message="Pronto podremos ofrecerte ayuda en tu proceso de precalificación para creditos inmobiliarios." />
        </main>
    );
}
