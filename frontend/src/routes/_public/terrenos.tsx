import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/terrenos')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_public/terrenos"!</div>
}
