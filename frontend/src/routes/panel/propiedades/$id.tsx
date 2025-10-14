import { EditPropertyForm, EditPropertyGalleryForm, EditPropertyPicForm } from '@/components/dashboard/propertyForm';
import { SqMtIcon } from '@/components/icons/icons';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { deletePropertyOpts, getSinglePropertyOpts } from '@/queries/properties';
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { CircleX, DollarSign, Home, Trash, UserIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/panel/propiedades/$id')({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        await context.queryClient.ensureQueryData(getSinglePropertyOpts(params.id));
    },
})

function RouteComponent() {
    const router = useRouter()
    const { id } = Route.useParams();
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const { data, status } = useSuspenseQuery(getSinglePropertyOpts(id));
    const deletePropertyMut = useMutation(deletePropertyOpts(id));
    const onDelete = useCallback(() => {
        deletePropertyMut.mutate({
            id: id,
        }, {
            onSuccess: () => {
                router.history.push("/panel/propiedades");
                toast.success("La propiedad ha sido eliminada correctamente.", { closeButton: true });
            },
            onError: (err) => {
                toast.error(err.message, { closeButton: true });
            },
        });
    }, [id])

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
        <main className="grid grid-cols-[1fr_2px_1fr] grid-rows-[auto_auto_1fr] gap-y-4 gap-x-6 bg-gray-200 p-2 px-4">
            <div className="col-span-full space-y-1">
                <h2 className="text-xl">
                    {prop.address}, {prop.nbHood}. C.P. {prop.zip}
                </h2>
                <ul className="flex items-center gap-6 py-1 capitalize text-current/60">
                    <li className="flex items-center gap-1.5 font-semibold">
                        <DollarSign className="size-4 text-current/60" />
                        <span>{prop.price.toLocaleString('es-ES', { style: 'currency', currency: 'MXN' })}</span>
                    </li>
                    <li className="flex items-center gap-1.5 font-semibold">
                        <Home className="size-4 text-current/80" />
                        <span>{prop.propertyType}</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                        <span>{prop.contract}</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                        <SqMtIcon className="size-4 text-current/60" />
                        <span>{prop.sqMt.toLocaleString('es-ES', { style: 'unit', unit: "meter", unitDisplay: "short" })}²</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                        <SqMtIcon className="size-4 text-current/60" />
                        <span>Const {prop.lotSize.toLocaleString('es-ES', { style: 'unit', unit: "meter", unitDisplay: "short" })}²</span>
                    </li>
                    <li className="flex items-center gap-1.5">
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
                    <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="text-base"
                                size="lg"
                                variant="destructive"
                            >
                                <Trash />
                                <span>Eliminar</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirmar eliminación</DialogTitle>
                            </DialogHeader>
                            <p className="text-sm text-current/60">¿Estás seguro de que quieres eliminar esta propiedad?</p>
                            <div className="flex justify-end gap-3">
                                <Button variant="secondary" size="sm" onClick={() => setDeleteConfirmOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button variant="destructive" size="sm" onClick={onDelete}>
                                    Eliminar
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </li>
            </ul>
            <div className="col-start-1 pt-2 pb-6">
                <div className="bg-accent p-4 py-6 rounded-lg shadow">
                    <EditPropertyForm property={prop} />
                </div>
            </div>
            <div className="col-start-2 w-full h-9/10 bg-gray-200/80 my-auto"></div>
            <div className="h-min grid grid-cols-1 grid-rows-[repeat(2,_auto)] gap-6 col-start-3">
                <div className="h-min bg-accent p-4 py-6 rounded-lg shadow">
                    <EditPropertyPicForm property={prop} />
                </div>
                <div className="h-min bg-accent p-4 py-6 rounded-lg shadow">
                    <EditPropertyGalleryForm property={prop} />
                </div>
            </div>
        </main>
    );
}
