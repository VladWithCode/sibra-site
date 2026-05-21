import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createTeamMemberOpts, getNextPosition, uploadTeamMemberPhotoOpts } from "@/queries/team";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Save, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/equipo/nuevo")({
    component: RouteComponent,
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData({
            queryKey: ["teamMembers", "nextPosition"],
            queryFn: getNextPosition,
        });
    },
});

function RouteComponent() {
    const navigate = useNavigate();
    const { data: nextPosition } = useSuspenseQuery({
        queryKey: ["teamMembers", "nextPosition"],
        queryFn: getNextPosition,
    });

    const createMut = useMutation(createTeamMemberOpts());
    const photoMut = useMutation(uploadTeamMemberPhotoOpts());

    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>("");

    const form = useForm({
        defaultValues: {
            name: "",
            role: "",
            bio: "",
            position: nextPosition,
        },
        onSubmit: async ({ value }) => {
            try {
                const result = await createMut.mutateAsync(value);
                const newId = result.id;

                if (photoFile) {
                    try {
                        await photoMut.mutateAsync({ id: newId, file: photoFile });
                    } catch (e: any) {
                        toast.warning(
                            `Miembro creado, pero falló la foto: ${e?.message || ""}`,
                            { closeButton: true },
                        );
                    }
                }

                toast.success("Miembro del equipo creado correctamente.", { closeButton: true });
                navigate({ to: "/panel/equipo" });
            } catch (e: any) {
                toast.error(e?.message || "Error al crear el miembro del equipo.", { closeButton: true });
            }
        },
    });

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onload = () => setPhotoPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="px-6 max-w-3xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Nuevo miembro del equipo</h1>
                <Button
                    onClick={() => form.handleSubmit()}
                    disabled={createMut.isPending}
                >
                    <Save className="mr-2 h-4 w-4" />
                    {createMut.isPending ? "Guardando..." : "Guardar"}
                </Button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}>
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Foto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-6">
                            <div className="h-24 w-24 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                {photoPreview ? (
                                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                        <Upload className="h-6 w-6" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <Input type="file" accept="image/*" onChange={handlePhotoChange} className="max-w-sm" />
                                <p className="text-xs text-muted-foreground mt-1">JPG, PNG o WebP. Máx 10MB.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Información</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form.Field
                            name="name"
                            validators={{
                                onChange: ({ value }) => !value || value.trim() === "" ? "El nombre es requerido" : undefined,
                            }}
                        >
                            {(field: any) => (
                                <Field>
                                    <FieldLabel htmlFor="name">Nombre</FieldLabel>
                                    <Input
                                        id="name"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        onBlur={field.handleBlur}
                                        placeholder="Nombre completo"
                                    />
                                    <FieldError errors={field.state.meta.errors as Array<{ message?: string }>} />
                                </Field>
                            )}
                        </form.Field>

                        <form.Field name="role">
                            {(field: any) => (
                                <Field>
                                    <FieldLabel htmlFor="role">Rol</FieldLabel>
                                    <Input
                                        id="role"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        onBlur={field.handleBlur}
                                        placeholder="Ej: Director de Proyectos"
                                    />
                                </Field>
                            )}
                        </form.Field>

                        <form.Field name="bio">
                            {(field: any) => (
                                <Field>
                                    <FieldLabel htmlFor="bio">Biografía</FieldLabel>
                                    <Textarea
                                        id="bio"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        onBlur={field.handleBlur}
                                        placeholder="Breve biografía del miembro del equipo"
                                        rows={5}
                                    />
                                </Field>
                            )}
                        </form.Field>

                        <form.Field name="position">
                            {(field: any) => (
                                <Field>
                                    <FieldLabel htmlFor="position">Posición</FieldLabel>
                                    <Input
                                        id="position"
                                        type="number"
                                        min={0}
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(parseInt(e.target.value, 10) || 0)}
                                        onBlur={field.handleBlur}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">0 = primero en la lista.</p>
                                </Field>
                            )}
                        </form.Field>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
