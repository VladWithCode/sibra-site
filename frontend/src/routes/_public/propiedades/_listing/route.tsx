import { useUIStore } from '@/stores/uiStore';
import { createFileRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react';

export const Route = createFileRoute('/_public/propiedades/_listing')({
    component: RouteComponent,
})

function RouteComponent() {
    const { setHeaderFloating, setHeaderComplement } = useUIStore();
    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplement('search');
    }, []);

    return (
        <>
            <Outlet />
        </>
    );
}
