import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    addProjectAssociateOpts,
    getAssociatesFilteredOpts,
} from '@/queries/projects';
import type { TProjectAssociate } from '@/queries/type';
import { useForm } from '@tanstack/react-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Search, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

const VincularSearchSchema = z.object({
    name: z.string().optional().catch(undefined),
    rfcOrCurp: z.string().optional().catch(undefined),
    phone: z.string().optional().catch(undefined),
});

type VincularSearch = z.infer<typeof VincularSearchSchema>;

function toFilters(search: VincularSearch) {
    return {
        name: search.name || undefined,
        rfcOrCurp: search.rfcOrCurp || undefined,
        phone: search.phone || undefined,
    };
}

export const Route = createFileRoute(
    '/panel/proyectos/$id/asociados/vincular',
)({
    component: RouteComponent,
    validateSearch: (search) => VincularSearchSchema.parse(search),
    loaderDeps: ({ search }) => toFilters(search),
    loader: async ({ context, deps }) => {
        await context.queryClient.ensureQueryData(
            getAssociatesFilteredOpts(deps),
        );
    },
});

type ErrorList = Array<{ message?: string } | undefined>;

function errsOf(field: { state: { meta: { errors: unknown } } }) {
    return field.state.meta.errors as unknown as ErrorList;
}

function RouteComponent() {
    const { id: projectId } = Route.useParams();
    const search = Route.useSearch();
    const filters = toFilters(search);

    const { data, isLoading } = useQuery(getAssociatesFilteredOpts(filters));
    const associates = data?.associates ?? [];

    const [selected, setSelected] = useState<TProjectAssociate | null>(null);

    return (
        <main className="bg-surface min-h-screen w-full p-6 lg:p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <header className="space-y-1.5">
                    <Link
                        to="/panel/proyectos/$id/asociados"
                        params={{ id: projectId }}
                        className="inline-flex items-center gap-1 text-primary text-xs font-semibold tracking-widest uppercase hover:underline"
                    >
                        <ArrowLeft className="size-3" />
                        Asociados del proyecto
                    </Link>
                    <h1 className="text-3xl font-extrabold tracking-tight">
                        Vincular asociado existente
                    </h1>
                    <p className="text-muted-foreground max-w-lg text-sm">
                        Busca un asociado en el sistema y vinculalo al proyecto
                        actual.
                    </p>
                </header>

                <VincularFilters filters={search} />

                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-20 animate-pulse rounded-xl border border-outline-variant/30 bg-surface-container-lowest"
                            />
                        ))}
                    </div>
                ) : associates.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-muted-foreground text-sm">
                            No se encontraron asociados con los filtros
                            actuales.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {associates.map((a) => (
                            <AssociateCard
                                key={a.id}
                                associate={a}
                                onClick={() => setSelected(a)}
                            />
                        ))}
                    </div>
                )}

                <LinkAssociateDialog
                    key={selected?.id}
                    associate={selected}
                    projectId={projectId}
                    open={!!selected}
                    onOpenChange={(open) => {
                        if (!open) setSelected(null);
                    }}
                />
            </div>
        </main>
    );
}

function VincularFilters({ filters }: { filters: VincularSearch }) {
    const navigate = useNavigate();
    const [name, setName] = useState(filters.name ?? '');
    const [rfcOrCurp, setRfcOrCurp] = useState(filters.rfcOrCurp ?? '');
    const [phone, setPhone] = useState(filters.phone ?? '');
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

    useEffect(() => {
        setName(filters.name ?? '');
    }, [filters.name]);
    useEffect(() => {
        setRfcOrCurp(filters.rfcOrCurp ?? '');
    }, [filters.rfcOrCurp]);
    useEffect(() => {
        setPhone(filters.phone ?? '');
    }, [filters.phone]);

    useEffect(
        () => () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        },
        [],
    );

    const updateSearch = useCallback(
        (key: string, value: string | undefined) => {
            navigate({
                to: '.',
                // @ts-ignore — router infers root search shape
                search: (prev) => ({ ...prev, [key]: value || undefined }),
                replace: true,
            });
        },
        [navigate],
    );

    const debouncedUpdate = (key: string, value: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(
            () => updateSearch(key, value),
            400,
        );
    };

    const hasActiveFilters = Boolean(
        filters.name || filters.rfcOrCurp || filters.phone,
    );

    const clearAll = () => {
        setName('');
        setRfcOrCurp('');
        setPhone('');
        if (debounceRef.current) clearTimeout(debounceRef.current);
        navigate({
            to: '.',
            // @ts-ignore
            search: () => ({}),
            replace: true,
        });
    };

    return (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
            <div className="relative lg:flex-1">
                <Search
                    aria-hidden
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-outline"
                />
                <Input
                    type="search"
                    placeholder="Buscar por nombre…"
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                        debouncedUpdate('name', e.target.value);
                    }}
                    className="h-10 pl-9 pr-3 bg-surface-container-lowest border-outline-variant/40 rounded-lg"
                />
            </div>

            <div className="grid grid-cols-2 gap-3 lg:flex lg:items-center lg:gap-3">
                <Input
                    type="search"
                    placeholder="RFC o CURP"
                    value={rfcOrCurp}
                    onChange={(e) => {
                        setRfcOrCurp(e.target.value);
                        debouncedUpdate('rfcOrCurp', e.target.value);
                    }}
                    className="h-10 bg-surface-container-lowest border-outline-variant/40 rounded-lg lg:w-44"
                />
                <Input
                    type="search"
                    placeholder="Teléfono"
                    value={phone}
                    onChange={(e) => {
                        setPhone(e.target.value);
                        debouncedUpdate('phone', e.target.value);
                    }}
                    className="h-10 bg-surface-container-lowest border-outline-variant/40 rounded-lg lg:w-44"
                />

                {hasActiveFilters ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearAll}
                        className="col-span-2 lg:col-span-1 h-10 gap-1 text-on-surface-variant"
                    >
                        <X className="size-4" />
                        Limpiar
                    </Button>
                ) : null}
            </div>
        </div>
    );
}

function AssociateCard({
    associate,
    onClick,
}: {
    associate: TProjectAssociate;
    onClick: () => void;
}) {
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onClick();
            }}
            className="cursor-pointer rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 flex flex-col gap-1 hover:shadow-md hover:border-sbr-blue/30 transition-all"
        >
            <span className="text-sm font-bold text-on-surface line-clamp-1">
                {associate.name || 'Sin nombre'}
            </span>
            <span className="text-xs text-on-surface-variant">
                {associate.rfc || associate.curp || '---'}
            </span>
        </div>
    );
}

function LinkAssociateDialog({
    associate,
    projectId,
    open,
    onOpenChange,
}: {
    associate: TProjectAssociate | null;
    projectId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const linkMut = useMutation(addProjectAssociateOpts(projectId));

    const form = useForm({
        defaultValues: {
            lotNum: '',
            appleNum: '',
            pendingPayment: false,
        },
        onSubmit: async ({ value }) => {
            if (!associate) return;
            try {
                await linkMut.mutateAsync({
                    associateId: associate.id,
                    pendingPayment: value.pendingPayment,
                    lotNum: value.lotNum || undefined,
                    appleNum: value.appleNum || undefined,
                });
                toast.success('Asociado vinculado al proyecto', {
                    closeButton: true,
                });
                onOpenChange(false);
            } catch (e: any) {
                toast.error(
                    e?.message || 'Error al vincular el asociado',
                    { closeButton: true },
                );
            }
        },
    });

    if (!associate) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Vincular asociado</DialogTitle>
                    <DialogDescription>
                        Revisa la información del asociado y completa los datos
                        de relación con el proyecto.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                                Información personal
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2 text-sm">
                                <div>
                                    <dt className="text-muted-foreground text-xs">
                                        Nombre
                                    </dt>
                                    <dd className="font-medium text-on-surface">
                                        {associate.name || '---'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground text-xs">
                                        Teléfono
                                    </dt>
                                    <dd className="font-medium text-on-surface">
                                        {associate.phone || '---'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground text-xs">
                                        RFC
                                    </dt>
                                    <dd className="font-medium text-on-surface">
                                        {associate.rfc || '---'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground text-xs">
                                        CURP
                                    </dt>
                                    <dd className="font-medium text-on-surface">
                                        {associate.curp || '---'}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <form
                        id="link-associate-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            form.handleSubmit();
                        }}
                    >
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    Relación con el proyecto
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                                    field.handleChange(
                                                        v === true,
                                                    )
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

                <DialogFooter>
                    <Button
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <form.Subscribe
                        selector={(s) => ({
                            canSubmit: s.canSubmit,
                            isSubmitting: s.isSubmitting,
                        })}
                    >
                        {({ canSubmit, isSubmitting }) => (
                            <Button
                                type="submit"
                                form="link-associate-form"
                                disabled={!canSubmit || isSubmitting}
                            >
                                {isSubmitting
                                    ? 'Vinculando...'
                                    : 'Vincular'}
                            </Button>
                        )}
                    </form.Subscribe>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
