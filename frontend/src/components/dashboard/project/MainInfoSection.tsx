import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LucideIcon } from "@/components/dashboard/property/LucideIcon";
import type { CSSProperties } from "react";

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
                <form.Field name="name">
                    {(field: any) => (
                        <Field>
                            <FieldLabel htmlFor="name">Nombre</FieldLabel>
                            <Input
                                id="name"
                                value={field.state.value ?? ""}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Nombre del proyecto"
                            />
                            <FieldError errors={errsOf(field)} />
                        </Field>
                    )}
                </form.Field>

                <form.Field name="summary">
                    {(field: any) => (
                        <Field>
                            <FieldLabel htmlFor="summary">Resumen</FieldLabel>
                            <Textarea
                                id="summary"
                                rows={2}
                                value={field.state.value ?? ""}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Resumen breve del proyecto..."
                            />
                            <FieldError errors={errsOf(field)} />
                        </Field>
                    )}
                </form.Field>

                <form.Field name="description">
                    {(field: any) => (
                        <Field>
                            <FieldLabel htmlFor="description">Descripción</FieldLabel>
                            <Textarea
                                id="description"
                                rows={5}
                                value={field.state.value ?? ""}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Describe el proyecto, su visión y características..."
                            />
                            <FieldError errors={errsOf(field)} />
                        </Field>
                    )}
                </form.Field>

                <form.Field name="quote">
                    {(field: any) => (
                        <Field>
                            <FieldLabel htmlFor="quote">Filosofía / Cita</FieldLabel>
                            <Textarea
                                id="quote"
                                rows={3}
                                value={field.state.value ?? ""}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Frase distintiva o filosofía del proyecto..."
                            />
                            <FieldError errors={errsOf(field)} />
                        </Field>
                    )}
                </form.Field>

                <div
                    className="grid gap-4"
                    style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" } as CSSProperties}
                >
                    <NumericStat form={form} name="total_area" label="Área total (m²)" iconName="Ruler" />
                    <NumericStat form={form} name="lot_count" label="Cantidad de lotes" iconName="LayoutGrid" />
                    <NumericStat form={form} name="available_lots" label="Lotes disponibles" iconName="CheckCircle2" />
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
