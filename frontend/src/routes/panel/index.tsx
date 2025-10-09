import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/panel/')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <main className=""></main>
    );
}
