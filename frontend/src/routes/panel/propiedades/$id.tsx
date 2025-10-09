import { EditPropertyForm } from '@/components/dashboard/propertyForm';
import { SqMtIcon } from '@/components/icons/icons';
import { Button } from '@/components/ui/button';
import { getSinglePropertyOpts } from '@/queries/properties';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router'
import { CircleX, DollarSign, Home, Trash, UserIcon } from 'lucide-react';

export const Route = createFileRoute('/panel/propiedades/$id')({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        await context.queryClient.ensureQueryData(getSinglePropertyOpts(params.id));
    },
})

function RouteComponent() {
    const { id } = Route.useParams();
    const { data, status } = useQuery(getSinglePropertyOpts(id));

    if (status === "pending") {
        return (
            <div className="col-span-full flex flex-col items-center justify-center gap-4">
                <span className="loader text-3xl w-24!"></span>
                <span className="text-2xl text-current/60 font-medium">Cargando...</span>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="col-span-full flex flex-col items-center justify-center gap-3">
                <CircleX className="size-40 fill-destructive text-gray-50" />
                <p className="text-2xl text-current/60 font-semibold">Ocurrió un error</p>
                <div className="mt-8">
                    <Button className="text-base" size="lg">Reintentar</Button>
                </div>
            </div>
        );
    }
    const prop = data.property;

    return (
        <main className="grid grid-cols-[1fr_2px_1fr] grid-rows-[auto_auto_1fr] gap-y-4 gap-x-6 p-2 px-4">
            <div className="col-span-full space-y-1">
                <h2 className="text-xl">
                    {prop.address}, {prop.nbHood}. C.P. <span className="font-secondary">{prop.zip}</span>
                </h2>
                <ul className="flex items-center gap-6 py-1 capitalize text-current/60">
                    <li className="flex items-center gap-1.5 font-secondary font-semibold">
                        <DollarSign className="size-4 text-current/60" />
                        <span>{prop.price.toLocaleString('es-ES', { style: 'currency', currency: 'MXN' })}</span>
                    </li>
                    <li className="flex items-center gap-1.5 font-semibold">
                        <Home className="size-4 text-current/80" />
                        <span>{prop.propertyType}</span>
                    </li>
                    <li className="flex items-center gap-1.5 font-secondary">
                        <span>{prop.contract}</span>
                    </li>
                    <li className="flex items-center gap-1.5 font-secondary">
                        <SqMtIcon className="size-4 text-current/60" />
                        <span>{prop.sqMt.toLocaleString('es-ES', { style: 'unit', unit: "meter", unitDisplay: "short" })}²</span>
                    </li>
                    <li className="flex items-center gap-1.5 font-secondary">
                        <SqMtIcon className="size-4 text-current/60" />
                        <span>Const {prop.lotSize.toLocaleString('es-ES', { style: 'unit', unit: "meter", unitDisplay: "short" })}²</span>
                    </li>
                    <li className="flex items-center gap-1.5 font-secondary">
                        <UserIcon className="size-4 text-current/80" />
                        <span>Subida por <strong>{prop.agentData.name}</strong></span>
                    </li>
                </ul>
            </div>
            <ul className="col-span-1 flex items-center gap-3">
                {/* <li> */}
                {/*     <Button className="text-base bg-sbr-blue-light" size="lg"> */}
                {/*         <Edit2 /> */}
                {/*         <span>Editar</span> */}
                {/*     </Button> */}
                {/* </li> */}
                <li>
                    <Button className="text-base" size="lg" variant="destructive">
                        <Trash />
                        <span>Eliminar</span>
                    </Button>
                </li>
            </ul>
            <div className="col-start-1 pt-2 pb-6">
                <EditPropertyForm property={prop} />
            </div>
            <div className="col-start-2 w-full h-9/10 bg-gray-200/80 my-auto"></div>
            <div className="col-start-3">
            </div>
        </main>
    );
}
