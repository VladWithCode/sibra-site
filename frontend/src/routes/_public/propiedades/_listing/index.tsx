import { createFileRoute, redirect, useParams } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/propiedades/_listing/')({
    component: RouteComponent,
    beforeLoad: ({ location }) => {
        console.log(location.pathname)
        // Redirect if no contract is provided
        throw redirect({ to: '/propiedades/venta' })
    },
})

function RouteComponent() {
    return <div>
        <h1>Listado de propiedades</h1>
    </div>
}
