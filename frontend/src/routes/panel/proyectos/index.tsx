import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/panel/proyectos/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/panel/terrenos/"!</div>
}
