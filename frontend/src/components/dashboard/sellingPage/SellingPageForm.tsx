import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DynamicCardsField, DynamicStepsField, DynamicStringList } from "./DynamicFields";

type ErrorList = Array<{ message?: string } | undefined>;
function errsOf(field: { state: { meta: { errors: unknown } } }) {
    return field.state.meta.errors as unknown as ErrorList;
}

function TextField({
    form,
    name,
    label,
    placeholder,
}: {
    form: any;
    name: string;
    label: string;
    placeholder?: string;
}) {
    return (
        <form.Field name={name}>
            {(field: any) => (
                <Field>
                    <FieldLabel htmlFor={name}>{label}</FieldLabel>
                    <Input
                        id={name}
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e: any) => field.handleChange(e.target.value)}
                        placeholder={placeholder}
                    />
                    <FieldError errors={errsOf(field)} />
                </Field>
            )}
        </form.Field>
    );
}

function AreaField({
    form,
    name,
    label,
    placeholder,
    rows = 2,
}: {
    form: any;
    name: string;
    label: string;
    placeholder?: string;
    rows?: number;
}) {
    return (
        <form.Field name={name}>
            {(field: any) => (
                <Field>
                    <FieldLabel htmlFor={name}>{label}</FieldLabel>
                    <Textarea
                        id={name}
                        rows={rows}
                        value={field.state.value ?? ""}
                        onBlur={field.handleBlur}
                        onChange={(e: any) => field.handleChange(e.target.value)}
                        placeholder={placeholder}
                    />
                    <FieldError errors={errsOf(field)} />
                </Field>
            )}
        </form.Field>
    );
}

/** Shared create/edit form body. `form` is a @tanstack/react-form instance. */
export function SellingPageForm({ form }: { form: any }) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Identidad y SEO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TextField
                        form={form}
                        name="name"
                        label="Nombre"
                        placeholder="Conquistadores"
                    />
                    <TextField
                        form={form}
                        name="slug"
                        label="Slug (URL)"
                        placeholder="conquistadores"
                    />
                    <form.Field name="variant">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="variant">Variante</FieldLabel>
                                <select
                                    id="variant"
                                    className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                                    value={field.state.value ?? "right"}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                >
                                    <option value="left">Izquierda</option>
                                    <option value="center">Centro</option>
                                    <option value="right">Derecha</option>
                                </select>
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>
                    <form.Field name="published">
                        {(field: any) => (
                            <Field>
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={!!field.state.value}
                                        onChange={(e) => field.handleChange(e.target.checked)}
                                    />
                                    Publicada
                                </label>
                            </Field>
                        )}
                    </form.Field>
                    <TextField form={form} name="seoTitle" label="Título SEO" />
                    <AreaField form={form} name="seoDescription" label="Descripción SEO" />
                    <TextField form={form} name="pixelId" label="Meta Pixel ID" />
                    <TextField
                        form={form}
                        name="whatsappNumber"
                        label="WhatsApp (solo dígitos)"
                        placeholder="5216181231212"
                    />
                    <AreaField form={form} name="whatsappMessage" label="Mensaje de WhatsApp" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Hero</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TextField form={form} name="heroTitle" label="Título" />
                    <AreaField form={form} name="heroSubtitle" label="Subtítulo" />
                    <TextField form={form} name="heroCtaLabel" label="Texto del botón" />
                    <TextField
                        form={form}
                        name="heroCtaTarget"
                        label="Destino del botón (#contacto o URL)"
                    />
                    <p className="text-muted-foreground text-xs">
                        El video, póster e imagen se suben como archivos en la página de
                        edición.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Disponibilidad y Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground text-xs">
                        El plano subido en multimedia (Disponibilidad — Imagen) es el que abre
                        el popup "Ver plano".
                    </p>
                    <TextField
                        form={form}
                        name="contactHeading"
                        label="Encabezado de contacto"
                    />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Financiamiento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TextField form={form} name="financingHeading" label="Encabezado" />
                    <AreaField form={form} name="financingBody" label="Cuerpo" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Oferta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TextField
                        form={form}
                        name="offerPrice"
                        label="Precio"
                        placeholder="$36,458"
                    />
                    <TextField
                        form={form}
                        name="offerPeriod"
                        label="Periodo"
                        placeholder="MES"
                    />
                    <TextField
                        form={form}
                        name="offerDimensions"
                        label="Dimensiones"
                        placeholder="10m x 25m"
                    />
                    <AreaField form={form} name="offerFinePrint" label="Letra chica" />
                    <Field>
                        <FieldLabel>Características</FieldLabel>
                        <DynamicStringList
                            form={form}
                            name="offerFeatures"
                            itemLabel="Característica"
                            addLabel="Agregar característica"
                            placeholder="Ej. Agua, luz y drenaje."
                        />
                    </Field>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Tarjetas</CardTitle>
                </CardHeader>
                <CardContent>
                    <DynamicCardsField form={form} name="cards" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Pasos</CardTitle>
                </CardHeader>
                <CardContent>
                    <DynamicStepsField form={form} name="steps" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Ubicación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <AreaField
                        form={form}
                        name="locationMapEmbed"
                        label="URL del mapa (Google Maps embed)"
                    />
                    <AreaField form={form} name="locationCaption" label="Descripción" />
                    <Field>
                        <FieldLabel>Chips de ubicación</FieldLabel>
                        <DynamicStringList
                            form={form}
                            name="chips"
                            itemLabel="Chip"
                            addLabel="Agregar chip"
                            placeholder="Ej. A 10 min del centro"
                        />
                    </Field>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Pie de página</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <TextField form={form} name="contactAddress" label="Dirección" />
                    <TextField form={form} name="contactHours" label="Horario" />
                    <TextField form={form} name="contactPhone" label="Teléfono" />
                </CardContent>
            </Card>
        </div>
    );
}
