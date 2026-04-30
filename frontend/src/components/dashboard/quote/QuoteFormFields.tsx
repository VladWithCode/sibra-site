import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    QUOTE_PROP_TYPE_LABELS,
    QUOTE_PROP_TYPES,
    QUOTE_STATUS_LABELS,
    QUOTE_STATUSES,
    QUOTE_TYPE_LABELS,
    QUOTE_TYPES,
} from "./schema";

type ErrorList = Array<{ message?: string } | undefined>;

function errsOf(field: { state: { meta: { errors: unknown } } }) {
    return field.state.meta.errors as unknown as ErrorList;
}

export function QuoteFormFields({ form }: { form: any }) {
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Datos de contacto</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <form.Field name="name">
                            {(field: any) => (
                                <Field>
                                    <FieldLabel htmlFor="name">Nombre</FieldLabel>
                                    <Input
                                        id="name"
                                        value={field.state.value ?? ""}
                                        onBlur={field.handleBlur}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        placeholder="Nombre del contacto"
                                    />
                                    <FieldError errors={errsOf(field)} />
                                </Field>
                            )}
                        </form.Field>
                        <form.Field name="phone">
                            {(field: any) => (
                                <Field>
                                    <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                                    <Input
                                        id="phone"
                                        value={field.state.value ?? ""}
                                        onBlur={field.handleBlur}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        placeholder="Número de teléfono"
                                    />
                                    <FieldError errors={errsOf(field)} />
                                </Field>
                            )}
                        </form.Field>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">
                        Detalles de la solicitud
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <form.Field name="type">
                            {(field: any) => (
                                <Field>
                                    <FieldLabel htmlFor="type">
                                        Tipo de solicitud
                                    </FieldLabel>
                                    <Select
                                        value={field.state.value}
                                        onValueChange={(v) => field.handleChange(v)}
                                    >
                                        <SelectTrigger id="type" className="w-full">
                                            <SelectValue placeholder="Selecciona un tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {QUOTE_TYPES.map((t) => (
                                                <SelectItem key={t} value={t}>
                                                    {QUOTE_TYPE_LABELS[t]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FieldError errors={errsOf(field)} />
                                </Field>
                            )}
                        </form.Field>
                        <form.Field name="propType">
                            {(field: any) => (
                                <Field>
                                    <FieldLabel htmlFor="propType">
                                        Tipo de propiedad
                                    </FieldLabel>
                                    <Select
                                        value={field.state.value}
                                        onValueChange={(v) => field.handleChange(v)}
                                    >
                                        <SelectTrigger
                                            id="propType"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Selecciona un tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {QUOTE_PROP_TYPES.map((t) => (
                                                <SelectItem key={t} value={t}>
                                                    {QUOTE_PROP_TYPE_LABELS[t]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FieldError errors={errsOf(field)} />
                                </Field>
                            )}
                        </form.Field>
                        <form.Field name="status">
                            {(field: any) => (
                                <Field>
                                    <FieldLabel htmlFor="status">Estatus</FieldLabel>
                                    <Select
                                        value={field.state.value}
                                        onValueChange={(v) => field.handleChange(v)}
                                    >
                                        <SelectTrigger
                                            id="status"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Selecciona un estatus" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {QUOTE_STATUSES.map((s) => (
                                                <SelectItem key={s} value={s}>
                                                    {QUOTE_STATUS_LABELS[s]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FieldError errors={errsOf(field)} />
                                </Field>
                            )}
                        </form.Field>
                    </div>

                    <form.Field name="scheduledDate">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="scheduledDate">
                                    Fecha programada
                                </FieldLabel>
                                <Input
                                    id="scheduledDate"
                                    type="datetime-local"
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                        field.handleChange(e.target.value)
                                    }
                                />
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <form.Field name="agent">
                            {(field: any) => (
                                <Field>
                                    <FieldLabel htmlFor="agent">Agente</FieldLabel>
                                    <Input
                                        id="agent"
                                        value={field.state.value ?? ""}
                                        onBlur={field.handleBlur}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        placeholder="Agente asignado"
                                    />
                                    <FieldError errors={errsOf(field)} />
                                </Field>
                            )}
                        </form.Field>
                        <form.Field name="property">
                            {(field: any) => (
                                <Field>
                                    <FieldLabel htmlFor="property">
                                        Propiedad
                                    </FieldLabel>
                                    <Input
                                        id="property"
                                        value={field.state.value ?? ""}
                                        onBlur={field.handleBlur}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        placeholder="Propiedad relacionada"
                                    />
                                    <FieldError errors={errsOf(field)} />
                                </Field>
                            )}
                        </form.Field>
                        <form.Field name="project">
                            {(field: any) => (
                                <Field>
                                    <FieldLabel htmlFor="project">
                                        Proyecto
                                    </FieldLabel>
                                    <Input
                                        id="project"
                                        value={field.state.value ?? ""}
                                        onBlur={field.handleBlur}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        placeholder="Proyecto relacionado"
                                    />
                                    <FieldError errors={errsOf(field)} />
                                </Field>
                            )}
                        </form.Field>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
