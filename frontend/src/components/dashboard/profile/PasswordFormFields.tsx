import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { KeyRound } from "lucide-react";

type ErrorList = Array<{ message?: string } | undefined>;

function errsOf(field: { state: { meta: { errors: unknown } } }) {
    return field.state.meta.errors as unknown as ErrorList;
}

export function PasswordFormFields({ form }: { form: any }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <KeyRound className="size-5" />
                    Cambiar contraseña
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <form.Field name="currentPassword">
                    {(field: any) => (
                        <Field>
                            <FieldLabel htmlFor="currentPassword">
                                Contraseña actual
                            </FieldLabel>
                            <Input
                                id="currentPassword"
                                type="password"
                                autoComplete="current-password"
                                value={field.state.value ?? ""}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="Tu contraseña actual"
                            />
                            <FieldDescription>
                                Confirma tu identidad antes de cambiar la contraseña.
                            </FieldDescription>
                            <FieldError errors={errsOf(field)} />
                        </Field>
                    )}
                </form.Field>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <form.Field name="password">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="password">
                                    Nueva contraseña
                                </FieldLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                />
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>
                    <form.Field name="confirmPassword">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="confirmPassword">
                                    Confirmar contraseña
                                </FieldLabel>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Repite la nueva contraseña"
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
