import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/propiedades')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_public/propiedades"!</div>
}
