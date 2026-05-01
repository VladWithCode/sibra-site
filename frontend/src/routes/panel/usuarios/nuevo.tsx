import { UserFormFields } from "@/components/dashboard/user/UserFormFields";
import {
    UserCreateFormSchema,
    buildUserPayload,
    userFormDefaults,
} from "@/components/dashboard/user/schema";
import { Button } from "@/components/ui/button";
import { createUserOpts } from "@/queries/users";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/usuarios/nuevo")({
    component: RouteComponent,
});

const entrance = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
} as const;

function RouteComponent() {
    const navigate = useNavigate();
    const createMut = useMutation(createUserOpts());

    const form = useForm({
        defaultValues: userFormDefaults,
        validators: { onChange: UserCreateFormSchema },
        onSubmit: async ({ value }) => {
            try {
                await createMut.mutateAsync(buildUserPayload(value));
                toast.success("Usuario creado", { closeButton: true });
                navigate({ to: "/panel/usuarios" });
            } catch (e: any) {
                toast.error(e?.message || "Error al crear el usuario", {
                    closeButton: true,
                });
            }
        },
    });

    return (
        <main className="bg-surface min-h-screen w-full p-6 lg:p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <motion.header
                    {...entrance}
                    className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
                >
                    <div className="space-y-1.5">
                        <span className="text-primary text-xs font-semibold tracking-widest uppercase">
                            Gestión de usuarios
                        </span>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Agregar nuevo usuario
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-sm">
                            Completa los datos del nuevo usuario.
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
                                form="create-user-form"
                                disabled={!canSubmit || isSubmitting}
                            >
                                <Save className="size-4" />
                                {isSubmitting ? "Guardando..." : "Guardar"}
                            </Button>
                        )}
                    </form.Subscribe>
                </motion.header>

                <motion.form
                    {...entrance}
                    transition={{ delay: 0.1 }}
                    id="create-user-form"
                    className="space-y-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <UserFormFields form={form} mode="create" />
                </motion.form>
            </div>
        </main>
    );
}
