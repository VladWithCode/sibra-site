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
import { USER_ROLES, USER_ROLE_LABELS } from "./schema";

type ErrorList = Array<{ message?: string } | undefined>;

function errsOf(field: { state: { meta: { errors: unknown } } }) {
    return field.state.meta.errors as unknown as ErrorList;
}

export function UserFormFields({
    form,
    mode,
}: {
    form: any;
    mode: "create" | "edit";
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Información del usuario</CardTitle>
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
                    <form.Field name="username">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="username">
                                    Nombre de usuario
                                </FieldLabel>
                                <Input
                                    id="username"
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="nombre.usuario"
                                />
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>
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
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    <form.Field name="role">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="role">Rol</FieldLabel>
                                <Select
                                    value={field.state.value}
                                    onValueChange={(v) => field.handleChange(v)}
                                >
                                    <SelectTrigger id="role" className="w-full">
                                        <SelectValue placeholder="Selecciona un rol" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {USER_ROLES.map((r) => (
                                            <SelectItem key={r} value={r}>
                                                {USER_ROLE_LABELS[r]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>
                </div>

                {mode === "create" && (
                    <form.Field name="password">
                        {(field: any) => (
                            <Field>
                                <FieldLabel htmlFor="password">
                                    Contraseña inicial
                                </FieldLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    value={field.state.value ?? ""}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                />
                                <FieldError errors={errsOf(field)} />
                            </Field>
                        )}
                    </form.Field>
                )}
            </CardContent>
        </Card>
    );
}
