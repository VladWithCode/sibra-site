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
import { Textarea } from "@/components/ui/textarea";
import { DollarSign } from "lucide-react";
import type { CSSProperties } from "react";
import { LucideIcon } from "./LucideIcon";
import {
    PROPERTY_CONTRACTS,
    PROPERTY_CONTRACT_LABELS,
    PROPERTY_STATUSES,
    PROPERTY_STATUS_LABELS,
    PROPERTY_TYPES,
    PROPERTY_TYPE_LABELS,
} from "./schema";

type ErrorList = Array<{ message?: string } | undefined>;

function errsOf(field: { state: { meta: { errors: unknown } } }) {
    return field.state.meta.errors as unknown as ErrorList;
}

function numberFromInput(value: string): number | undefined {
    if (value === "") return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
}

export function MainInfoSection({ form }: { form: any }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Información básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <form.Field name="title">
                    {(field: any) => (
                        <Field>
                            <FieldLabel htmlFor="title">Título</FieldLabel>
                            <Input
                                id="title"
                                value={field.state.value ?? ""}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Casa moderna con jardín en Mérida"
                            />
                            <FieldError errors={errsOf(field)} />
                        </Field>
                    )}
                </form.Field>

                <form.Field name="address">
                    {(field: any) => (
                        <Field>
                            <FieldLabel htmlFor="address">Dirección</FieldLabel>
                            <Input
                                id="address"
                                value={field.state.value ?? ""}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Calle y número, Colonia"
                            />
                            <FieldError errors={errsOf(field)} />
                        </Field>
                    )}
                </form.Field>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <form.Field name="zip">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="zip">Código postal</FieldLabel>
                                <Input
                                    id="zip"
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <form.Field name="city">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="city">Ciudad</FieldLabel>
                                <Input
                                    id="city"
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>
                    <form.Field name="state">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="state">Estado</FieldLabel>
                                <Input
                                    id="state"
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>
                    <form.Field name="country">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="country">País</FieldLabel>
                                <Input
                                    id="country"
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>
                </div>

                <form.Field name="description">
                    {(field: any) => (
                        <Field>
                            <FieldLabel htmlFor="description">Descripción</FieldLabel>
                            <Textarea
                                id="description"
                                rows={4}
                                value={field.state.value ?? ""}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Describe la propiedad, sus acabados y atmósfera..."
                            />
                            <FieldError errors={errsOf(field)} />
                        </Field>
                    )}
                </form.Field>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <form.Field name="price">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="price">Precio (MXN)</FieldLabel>
                                <div className="relative">
                                    <DollarSign className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                                    <Input
                                        id="price"
                                        type="number"
                                        min={0}
                                        className="pl-9"
                                        value={field.state.value === undefined ? "" : field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(numberFromInput(e.target.value))}
                                    />
                                </div>
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
                                    <SelectTrigger id="status" className="w-full">
                                        <SelectValue placeholder="Selecciona un estatus" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROPERTY_STATUSES.map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {PROPERTY_STATUS_LABELS[s]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <form.Field name="propertyType">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="propertyType">Tipo de propiedad</FieldLabel>
                                <Select
                                    value={field.state.value}
                                    onValueChange={(v) => field.handleChange(v)}
                                >
                                    <SelectTrigger id="propertyType" className="w-full">
                                        <SelectValue placeholder="Selecciona un tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROPERTY_TYPES.map((t) => (
                                            <SelectItem key={t} value={t}>
                                                {PROPERTY_TYPE_LABELS[t]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>
                    <form.Field name="contract">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="contract">Tipo de contrato</FieldLabel>
                                <Select
                                    value={field.state.value}
                                    onValueChange={(v) => field.handleChange(v)}
                                >
                                    <SelectTrigger id="contract" className="w-full">
                                        <SelectValue placeholder="Selecciona un contrato" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROPERTY_CONTRACTS.map((c) => (
                                            <SelectItem key={c} value={c}>
                                                {PROPERTY_CONTRACT_LABELS[c]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>
                </div>

                <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" } as CSSProperties}
                >
                    <NumericStat form={form} name="beds" label="Recámaras" iconName="Bed" />
                    <NumericStat form={form} name="baths" label="Baños" iconName="Bath" />
                    <NumericStat form={form} name="sqMt" label="Terreno (m²)" iconName="Ruler" />
                    <NumericStat form={form} name="lotSize" label="Construcción (m²)" iconName="Home" />
                    <NumericStat form={form} name="yearBuilt" label="Año de construcción" iconName="Calendar" />
                </div>
            </CardContent>
        </Card>
    );
}

function NumericStat({
    form,
    name,
    label,
    iconName,
}: {
    form: any;
    name: string;
    label: string;
    iconName: string;
}) {
    return (
        <form.Field name={name}>
            {(field: any) => (
                <Field>
                    <FieldLabel htmlFor={name} className="text-xs uppercase tracking-wide">
                        <LucideIcon name={iconName} className="size-3.5" />
                        {label}
                    </FieldLabel>
                    <Input
                        id={name}
                        type="number"
                        min={0}
                        value={field.state.value === undefined ? "" : field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(numberFromInput(e.target.value))}
                    />
                    <FieldError errors={errsOf(field)} />
                </Field>
            )}
        </form.Field>
    );
}

