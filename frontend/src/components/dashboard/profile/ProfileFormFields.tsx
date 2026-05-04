import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { UserCog } from "lucide-react";

type ErrorList = Array<{ message?: string } | undefined>;

function errsOf(field: { state: { meta: { errors: unknown } } }) {
    return field.state.meta.errors as unknown as ErrorList;
}

export function ProfileFormFields({ form }: { form: any }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <UserCog className="size-5" />
                    Datos personales
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <form.Field name="name">
                    {(field: any) => (
                        <Field>
                            <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
                            <Input
                                id="name"
                                value={field.state.value ?? ""}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Nombre y apellido"
                            />
                            <FieldError errors={errsOf(field)} />
                        </Field>
                    )}
                </form.Field>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <form.Field name="email">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="correo@ejemplo.com"
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
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="614 123 4567"
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
