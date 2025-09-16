import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/terminos-y-condiciones')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_public/terminos-y-condiciones"!</div>
}
