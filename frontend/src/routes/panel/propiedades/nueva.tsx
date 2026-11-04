import { AmenitiesSection } from "@/components/dashboard/property/AmenitiesSection";
import { DetailsSection } from "@/components/dashboard/property/DetailsSection";
import { FeaturesSection } from "@/components/dashboard/property/FeaturesSection";
import { GallerySection } from "@/components/dashboard/property/GallerySection";
import { LocationMapSection } from "@/components/dashboard/property/LocationMapSection";
import { MainInfoSection } from "@/components/dashboard/property/MainInfoSection";
import {
    PropertyFormSchema,
    buildPropertyPayload,
    propertyFormDefaults,
} from "@/components/dashboard/property/schema";
import { Button } from "@/components/ui/button";
import { getAmenitiesOpts } from "@/queries/amenities";
import { getFeaturesOpts } from "@/queries/features";
import { createPropertyOpts } from "@/queries/properties";
import {
    checkMediaFile,
    uploadPropertyMainImage,
    uploadPropertyMediaFile,
} from "@/queries/propertyMedia";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";

/**
 * Uploads the files staged while creating a property, one per request, with a
 * single progress toast. Failures are reported per file; the property itself
 * is already saved and its media can be completed from the edit page.
 */
async function uploadStagedMedia(id: string, mainImg: File | undefined, gallery: File[]) {
    type Upload = (id: string, file: File, onProgress: (f: number) => void) => Promise<unknown>;
    const jobs: { file: File; upload: Upload; allowVideo: boolean }[] = [];
    if (mainImg)
        jobs.push({ file: mainImg, upload: uploadPropertyMainImage, allowVideo: false });
    for (const file of gallery)
        jobs.push({ file, upload: uploadPropertyMediaFile, allowVideo: true });
    if (jobs.length === 0) return;

    const toastId = toast.loading("Subiendo archivos…");
    const failures: string[] = [];
    for (const [i, job] of jobs.entries()) {
        const label = `Subiendo ${i + 1} de ${jobs.length}: ${job.file.name}`;
        const problem = await checkMediaFile(job.file, job.allowVideo);
        if (problem) {
            failures.push(problem);
            continue;
        }
        try {
            await job.upload(id, job.file, (f) =>
                toast.loading(`${label} (${Math.round(f * 100)}%)`, { id: toastId }),
            );
        } catch (e: any) {
            failures.push(`${job.file.name}: ${e?.message || "error"}`);
        }
    }
    toast.dismiss(toastId);
    if (failures.length > 0) {
        toast.warning(
            `La propiedad se guardó, pero algunos archivos fallaron: ${failures.join("; ")}`,
            {
                closeButton: true,
                duration: 15000,
            },
        );
    } else {
        toast.success("Archivos subidos; se están optimizando en el servidor", {
            closeButton: true,
        });
    }
}

export const Route = createFileRoute("/panel/propiedades/nueva")({
    component: RouteComponent,
    loader: async ({ context }) => {
        await Promise.all([
            context.queryClient.ensureQueryData(getFeaturesOpts),
            context.queryClient.ensureQueryData(getAmenitiesOpts),
        ]);
    },
});

function RouteComponent() {
    const navigate = useNavigate();
    const createMut = useMutation(createPropertyOpts());

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

                await uploadStagedMedia(newId, value.mainImg, value.gallery);

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
                            Completa los detalles arquitectónicos y financieros para registrar
                            la propiedad.
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
                    <DetailsSection form={form} />
                    <FeaturesSection form={form} />
                    <AmenitiesSection form={form} />
                </form>
            </div>
        </main>
    );
}
