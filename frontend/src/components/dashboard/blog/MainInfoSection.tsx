import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ErrorList = Array<{ message?: string } | undefined>;
function errsOf(field: { state: { meta: { errors: unknown } } }): ErrorList {
    return field.state.meta.errors as unknown as ErrorList;
}

export function MainInfoSection({ form, readonlySlug }: { form: any; readonlySlug?: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Información básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Slug — shown read-only when editing */}
                {readonlySlug !== undefined && (
                    <Field>
                        <FieldLabel htmlFor="slug-display">Slug</FieldLabel>
                        <Input
                            id="slug-display"
                            value={readonlySlug}
                            readOnly
                            disabled
                            className="font-mono text-sm bg-surface-container"
                        />
                        <p className="text-xs text-outline">El slug no puede modificarse después de crear el post.</p>
                    </Field>
                )}

                <form.Field name="title">
                    {(field: any) => (
                        <Field>
                            <FieldLabel htmlFor="title">Título <span className="text-destructive">*</span></FieldLabel>
                            <Input
                                id="title"
                                value={field.state.value ?? ""}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Título del post"
                            />
                            <FieldError errors={errsOf(field)} />
                        </Field>
                    )}
                </form.Field>

                <form.Field name="snippet">
                    {(field: any) => (
                        <Field>
                            <FieldLabel htmlFor="snippet">Resumen (snippet)</FieldLabel>
                            <Textarea
                                id="snippet"
                                value={field.state.value ?? ""}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Breve descripción del post para listados y SEO…"
                                rows={3}
                            />
                            <FieldError errors={errsOf(field)} />
                        </Field>
                    )}
                </form.Field>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <form.Field name="coverImage">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="coverImage">Imagen de portada (URL)</FieldLabel>
                                <Input
                                    id="coverImage"
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="/static/uploads/blog/imagen.jpg"
                                />
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>

                    <form.Field name="readingTime">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="readingTime">Tiempo de lectura (min)</FieldLabel>
                                <Input
                                    id="readingTime"
                                    type="number"
                                    min={1}
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        field.handleChange(v === "" ? undefined : Number(v));
                                    }}
                                    placeholder="Auto-calculado si se deja vacío"
                                />
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>
                </div>
            </CardContent>
        </Card>
    );
}
