import { AmenitiesSection } from "@/components/dashboard/property/AmenitiesSection";
import { FeaturesSection } from "@/components/dashboard/property/FeaturesSection";
import { GallerySection } from "@/components/dashboard/property/GallerySection";
import { LocationMapSection } from "@/components/dashboard/property/LocationMapSection";
import { MainInfoSection } from "@/components/dashboard/property/MainInfoSection";
import {
    PropertyFormSchema,
    propertyFormDefaults,
    type PropertyFormValues,
} from "@/components/dashboard/property/schema";
import { Button } from "@/components/ui/button";
import { getAmenitiesOpts } from "@/queries/amenities";
import { getFeaturesOpts } from "@/queries/features";
import {
    createPropertyOpts,
    updatePropertyGalleryOpts,
    updatePropertyMainImgOpts,
} from "@/queries/properties";
import type { TProperty } from "@/queries/type";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/propiedades/nueva")({
    component: RouteComponent,
    loader: async ({ context }) => {
        await Promise.all([
            context.queryClient.ensureQueryData(getFeaturesOpts),
            context.queryClient.ensureQueryData(getAmenitiesOpts),
        ]);
    },
});

function buildPropertyPayload(v: PropertyFormValues): Partial<TProperty> {
    const payload: Partial<TProperty> = {
        address: v.address,
        nbHood: v.nbHood,
        city: v.city,
        state: v.state,
        zip: v.zip,
        country: v.country,
        description: v.description,
        price: v.price,
        propertyType: v.propertyType,
        contract: v.contract,
        status: v.status,
        beds: v.beds,
        baths: v.baths,
        sqMt: v.sqMt,
        lotSize: v.lotSize,
        featured: v.featured,
        features: v.features as TProperty["features"],
        amenities: v.amenities as TProperty["amenities"],
    };
    if (typeof v.yearBuilt === "number") payload.yearBuilt = v.yearBuilt;
    if (typeof v.lat === "number") payload.lat = v.lat;
    if (typeof v.lon === "number") payload.lon = v.lon;
    return payload;
}

function RouteComponent() {
    const navigate = useNavigate();
    const createMut = useMutation(createPropertyOpts());
    const mainImgMut = useMutation(updatePropertyMainImgOpts(""));
    const galleryMut = useMutation(updatePropertyGalleryOpts(""));

    const form = useForm({
        defaultValues: propertyFormDefaults,
        validators: { onChange: PropertyFormSchema },
        onSubmit: async ({ value }) => {
            try {
                const result = await createMut.mutateAsync({
                    property: buildPropertyPayload(value),
                });
                const newId = result.property.id;
                toast.success("Propiedad creada", { closeButton: true });

                if (value.mainImg) {
                    try {
                        await mainImgMut.mutateAsync({ id: newId, file: value.mainImg });
                    } catch (e: any) {
                        toast.warning(
                            `La propiedad se guardó, pero falló la imagen principal: ${
                                e?.message || ""
                            }`,
                            { closeButton: true },
                        );
                    }
                }

                if (value.gallery.length > 0) {
                    try {
                        await galleryMut.mutateAsync({
                            id: newId,
                            files: value.gallery,
                        });
                    } catch (e: any) {
                        toast.warning(
                            `La propiedad se guardó, pero falló la galería: ${
                                e?.message || ""
                            }`,
                            { closeButton: true },
                        );
                    }
                }

                navigate({
                    to: "/panel/propiedades/$id",
                    params: { id: newId },
                });
            } catch (e: any) {
                toast.error(e?.message || "Error al crear la propiedad", {
                    closeButton: true,
                });
            }
        },
    });

    return (
        <main className="bg-surface min-h-screen w-full p-6 lg:p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-1.5">
                        <span className="text-primary text-xs font-semibold tracking-widest uppercase">
                            Gestión de inventario
                        </span>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Agregar nueva propiedad
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-sm">
                            Completa los detalles arquitectónicos y financieros para
                            registrar la propiedad.
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
                                form="create-property-form"
                                disabled={!canSubmit || isSubmitting}
                            >
                                <Save className="size-4" />
                                {isSubmitting ? "Guardando..." : "Guardar"}
                            </Button>
                        )}
                    </form.Subscribe>
                </header>

                <form
                    id="create-property-form"
                    className="space-y-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <MainInfoSection form={form} />
                    <LocationMapSection form={form} />
                    <GallerySection form={form} />
                    <FeaturesSection form={form} />
                    <AmenitiesSection form={form} />
                </form>
            </div>
        </main>
    );
}
