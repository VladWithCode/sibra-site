import { CreatePropertyForm } from '@/components/dashboard/propertyForm';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/panel/propiedades/nueva')({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <main className="grid grid-cols-[1fr_2px_1fr] grid-rows-[auto_1fr] gap-y-4 gap-x-6 bg-gray-200 p-2 px-4">
            <div className="col-span-full space-y-1">
                <h2 className="text-xl">Crear propiedad</h2>
                <p className="text-current/60">Ingresa los datos de la propiedad que deseas crear.</p>
            </div>
            <div className="col-span-1 pt-2 pb-6">
                <div className="bg-accent p-4 py-6 rounded-lg shadow">
                    <CreatePropertyForm />
                </div>
            </div>
            <div className="col-start-2 w-full h-9/10 bg-gray-800/15 my-auto"></div>
            <div className="col-span-1 pt-2 pb-6">
                <div className="flex flex-col place-items-center gap-3 h-min w-full bg-accent p-12 py-24 rounded-lg shadow">
                    <p className="text-xl">Crea la propiedad para agregar fotos.</p>
                    <p className="text-muted-foreground">Podrás agregar fotos a tu propiedad desde la página de detalles.</p>
                </div>
            </div>
        </main>
    );
}
