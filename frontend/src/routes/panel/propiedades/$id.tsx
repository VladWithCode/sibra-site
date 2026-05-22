import { PropertyImage } from "@/components/Image";
import { AmenitiesSection } from "@/components/dashboard/property/AmenitiesSection";
import { FeaturesSection } from "@/components/dashboard/property/FeaturesSection";
import { GallerySection } from "@/components/dashboard/property/GallerySection";
import { LocationMapSection } from "@/components/dashboard/property/LocationMapSection";
import { MainInfoSection } from "@/components/dashboard/property/MainInfoSection";
import {
    PropertyFormSchema,
    buildPropertyPayload,
    propertyToFormValues,
} from "@/components/dashboard/property/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAmenitiesOpts } from "@/queries/amenities";
import { getFeaturesOpts } from "@/queries/features";
import {
    deletePropertyImgOpts,
    getSinglePropertyOpts,
    updatePropertyDetailsOpts,
    updatePropertyGalleryOpts,
    updatePropertyMainImgOpts,
} from "@/queries/properties";
import type { TProperty } from "@/queries/type";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/propiedades/$id")({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        const [propertyData] = await Promise.all([
            context.queryClient.ensureQueryData(getSinglePropertyOpts(params.id)),
            context.queryClient.ensureQueryData(getFeaturesOpts),
            context.queryClient.ensureQueryData(getAmenitiesOpts),
        ]);
        return { propertyTitle: propertyData.property.title };
    },
});

function RouteComponent() {
    const { id } = Route.useParams();
    const { data } = useSuspenseQuery(getSinglePropertyOpts(id));
    const property = data.property;

    const updateMut = useMutation(updatePropertyDetailsOpts(id));
    const mainImgMut = useMutation(updatePropertyMainImgOpts(id));
    const galleryMut = useMutation(updatePropertyGalleryOpts(id));
    const deleteImgMut = useMutation(deletePropertyImgOpts(id));

    const form = useForm({
        defaultValues: propertyToFormValues(property),
        validators: { onChange: PropertyFormSchema },
        onSubmit: async ({ value }) => {
            try {
                const payload = { ...buildPropertyPayload(value), id };
                await updateMut.mutateAsync(payload);
                toast.success("Propiedad actualizada", { closeButton: true });

                if (value.mainImg) {
                    try {
                        await mainImgMut.mutateAsync({ id, file: value.mainImg });
                    } catch (e: any) {
                        toast.warning(
                            `Se guardó la propiedad, pero falló la imagen principal: ${e?.message || ""}`,
                            { closeButton: true },
                        );
                    }
                }

                if (value.gallery.length > 0) {
                    try {
                        await galleryMut.mutateAsync({ id, files: value.gallery });
                    } catch (e: any) {
                        toast.warning(
                            `Se guardó la propiedad, pero falló la galería: ${e?.message || ""}`,
                            { closeButton: true },
                        );
                    }
                }
            } catch (e: any) {
                toast.error(e?.message || "Error al actualizar la propiedad", {
                    closeButton: true,
                });
            }
        },
    });

    function handleDeleteImg(imgName: string, type: "main" | "gallery") {
        deleteImgMut.mutate(
            { id, imgName, type },
            {
                onSuccess: () =>
                    toast.success("Imagen eliminada", { closeButton: true }),
                onError: (e: any) =>
                    toast.error(e?.message || "Error al eliminar la imagen", {
                        closeButton: true,
                    }),
            },
        );
    }

    return (
        <main className="bg-surface min-h-screen w-full p-6 lg:p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-1.5">
                        <span className="text-primary text-xs font-semibold tracking-widest uppercase">
                            Gestión de inventario
                        </span>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Editar propiedad
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-sm">
                            Modifica los detalles de la propiedad.
                        </p>
                    </div>
                    <form.Subscribe
                        selector={(s) => ({
                            canSubmit: s.canSubmit,
                            isSubmitting: s.isSubmitting,
                        })}
                    >
                        {({ canSubmit, isSubmitting }) => (
                            <Button
                                size="lg"
                                type="submit"
                                form="edit-property-form"
                                disabled={!canSubmit || isSubmitting}
                            >
                                <Save className="size-4" />
                                {isSubmitting ? "Guardando..." : "Guardar"}
                            </Button>
                        )}
                    </form.Subscribe>
                </header>

                <form
                    id="edit-property-form"
                    className="space-y-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <MainInfoSection form={form} />
                    <LocationMapSection form={form} />
                    <ExistingImagesSection
                        property={property}
                        onDelete={handleDeleteImg}
                        isDeleting={deleteImgMut.isPending}
                    />
                    <GallerySection form={form} />
                    <FeaturesSection form={form} />
                    <AmenitiesSection form={form} />
                </form>
            </div>
        </main>
    );
}

function ExistingImagesSection({
    property,
    onDelete,
    isDeleting,
}: {
    property: TProperty;
    onDelete: (imgName: string, type: "main" | "gallery") => void;
    isDeleting: boolean;
}) {
    const hasMainImg = !!property.mainImg;
    const hasGallery = property.imgs && property.imgs.length > 0;

    if (!hasMainImg && !hasGallery) return null;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Imágenes actuales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {hasMainImg && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Imagen principal</p>
                        <div className="group relative aspect-video w-full overflow-hidden rounded-lg">
                            <PropertyImage
                                propId={property.id}
                                propName={property.address}
                                src={property.mainImg}
                                className="h-full w-full object-cover"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                disabled={isDeleting}
                                onClick={() => onDelete(property.mainImg, "main")}
                                className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}
                {hasGallery && (
                    <div className="space-y-2">
                        <p className="text-sm font-medium">Galería</p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {property.imgs.map((img) => (
                                <div
                                    key={img}
                                    className="group relative aspect-square overflow-hidden rounded-md border"
                                >
                                    <PropertyImage
                                        propId={property.id}
                                        propName={property.address}
                                        src={img}
                                        className="h-full w-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        disabled={isDeleting}
                                        onClick={() => onDelete(img, "gallery")}
                                        className="bg-background/80 text-destructive absolute top-2 right-2 rounded p-1 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
