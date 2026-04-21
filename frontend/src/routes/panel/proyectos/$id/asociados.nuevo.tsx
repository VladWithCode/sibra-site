import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addProjectAssociateOpts, createAssociateOpts } from '@/queries/projects';
import { useForm } from '@tanstack/react-form';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const AssociateFormSchema = z
    .object({
        name: z.string(),
        phone: z.string(),
        rfc: z.string(),
        curp: z.string(),
        lotNum: z.string(),
        appleNum: z.string(),
        pendingPayment: z.boolean(),
    })
    .refine(
        (data) => data.rfc.length > 0 || data.curp.length > 0,
        { message: 'Se requiere al menos RFC o CURP', path: ['rfc'] },
    );

type AssociateFormValues = {
    name: string;
    phone: string;
    rfc: string;
    curp: string;
    lotNum: string;
    appleNum: string;
    pendingPayment: boolean;
};

const associateFormDefaults: AssociateFormValues = {
    name: '',
    phone: '',
    rfc: '',
    curp: '',
    lotNum: '',
    appleNum: '',
    pendingPayment: false,
};

type ErrorList = Array<{ message?: string } | undefined>;

function errsOf(field: { state: { meta: { errors: unknown } } }) {
    return field.state.meta.errors as unknown as ErrorList;
}

export const Route = createFileRoute('/panel/proyectos/$id/asociados/nuevo')({
    component: RouteComponent,
});

function RouteComponent() {
    const { id: projectId } = Route.useParams();
    const navigate = useNavigate();
    const createMut = useMutation(createAssociateOpts());
    const linkMut = useMutation(addProjectAssociateOpts(projectId));

    const form = useForm({
        defaultValues: associateFormDefaults,
        validators: { onChange: AssociateFormSchema },
        onSubmit: async ({ value }) => {
            try {
                const result = await createMut.mutateAsync({
                    name: value.name || undefined,
                    phone: value.phone || undefined,
                    rfc: value.rfc || undefined,
                    curp: value.curp || undefined,
                });

                toast.success('Asociado creado', { closeButton: true });

                try {
                    const res = await linkMut.mutateAsync({
                        associateId: result.associate.id,
                        pendingPayment: value.pendingPayment,
                        lotNum: value.lotNum || undefined,
                        appleNum: value.appleNum || undefined,
                    });

                    console.log("associate", res);
                } catch (e: any) {
                    console.log(e);
                    toast.warning(
                        `El asociado se creó, pero falló al vincularlo al proyecto: ${e?.message || ''}`,
                        { closeButton: true },
                    );
                }

                navigate({
                    to: '/panel/proyectos/$id/asociados',
                    params: { id: projectId },
                });
            } catch (e: any) {
                toast.error(e?.message || 'Error al crear el asociado', {
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
                        <Link
                            to="/panel/proyectos/$id/asociados"
                            params={{ id: projectId }}
                            className="inline-flex items-center gap-1 text-primary text-xs font-semibold tracking-widest uppercase hover:underline"
                        >
                            <ArrowLeft className="size-3" />
                            Asociados del proyecto
                        </Link>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Agregar nuevo asociado
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-sm">
                            Completa la información del asociado y su relación con el
                            proyecto.
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
                                form="create-associate-form"
                                disabled={!canSubmit || isSubmitting}
                            >
                                <Save className="size-4" />
                                {isSubmitting ? 'Guardando...' : 'Guardar'}
                            </Button>
                        )}
                    </form.Subscribe>
                </header>

                <form
                    id="create-associate-form"
                    className="space-y-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">
                                Información personal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <form.Field name="name">
                                {(field: any) => (
                                    <Field>
                                        <FieldLabel htmlFor="name">
                                            Nombre
                                        </FieldLabel>
                                        <Input
                                            id="name"
                                            value={field.state.value ?? ''}
                                            onBlur={field.handleBlur}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Nombre completo del asociado"
                                        />
                                        <FieldError errors={errsOf(field)} />
                                    </Field>
                                )}
                            </form.Field>

                            <form.Field name="phone">
                                {(field: any) => (
                                    <Field>
                                        <FieldLabel htmlFor="phone">
                                            Teléfono
                                        </FieldLabel>
                                        <Input
                                            id="phone"
                                            value={field.state.value ?? ''}
                                            onBlur={field.handleBlur}
                                            onChange={(e) =>
                                                field.handleChange(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Teléfono de contacto"
                                        />
                                        <FieldError errors={errsOf(field)} />
                                    </Field>
                                )}
                            </form.Field>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <form.Field name="rfc">
                                    {(field: any) => (
                                        <Field>
                                            <FieldLabel htmlFor="rfc">
                                                RFC
                                            </FieldLabel>
                                            <Input
                                                id="rfc"
                                                value={
                                                    field.state.value ?? ''
                                                }
                                                onBlur={field.handleBlur}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="RFC del asociado"
                                            />
                                            <FieldError
                                                errors={errsOf(field)}
                                            />
                                        </Field>
                                    )}
                                </form.Field>

                                <form.Field name="curp">
                                    {(field: any) => (
                                        <Field>
                                            <FieldLabel htmlFor="curp">
                                                CURP
                                            </FieldLabel>
                                            <Input
                                                id="curp"
                                                value={
                                                    field.state.value ?? ''
                                                }
                                                onBlur={field.handleBlur}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="CURP del asociado"
                                            />
                                            <FieldError
                                                errors={errsOf(field)}
                                            />
                                        </Field>
                                    )}
                                </form.Field>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">
                                Relación con el proyecto
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <form.Field name="lotNum">
                                    {(field: any) => (
                                        <Field>
                                            <FieldLabel htmlFor="lotNum">
                                                Número de lote
                                            </FieldLabel>
                                            <Input
                                                id="lotNum"
                                                value={
                                                    field.state.value ?? ''
                                                }
                                                onBlur={field.handleBlur}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Ej. 12"
                                            />
                                            <FieldError
                                                errors={errsOf(field)}
                                            />
                                        </Field>
                                    )}
                                </form.Field>

                                <form.Field name="appleNum">
                                    {(field: any) => (
                                        <Field>
                                            <FieldLabel htmlFor="appleNum">
                                                Número de manzana
                                            </FieldLabel>
                                            <Input
                                                id="appleNum"
                                                value={
                                                    field.state.value ?? ''
                                                }
                                                onBlur={field.handleBlur}
                                                onChange={(e) =>
                                                    field.handleChange(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Ej. 3"
                                            />
                                            <FieldError
                                                errors={errsOf(field)}
                                            />
                                        </Field>
                                    )}
                                </form.Field>
                            </div>

                            <form.Field name="pendingPayment">
                                {(field: any) => (
                                    <Field orientation="horizontal">
                                        <Checkbox
                                            id="pendingPayment"
                                            checked={field.state.value}
                                            onBlur={field.handleBlur}
                                            onCheckedChange={(v) =>
                                                field.handleChange(v === true)
                                            }
                                        />
                                        <Label htmlFor="pendingPayment">
                                            Pago pendiente
                                        </Label>
                                    </Field>
                                )}
                            </form.Field>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </main>
    );
}
