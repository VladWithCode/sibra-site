import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/panel/citas/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/panel/citas/"!</div>
}
