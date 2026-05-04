import { PasswordFormFields } from "@/components/dashboard/profile/PasswordFormFields";
import {
    PasswordFormSchema,
    passwordFormDefaults,
} from "@/components/dashboard/profile/schema";
import { Button } from "@/components/ui/button";
import { updatePasswordOpts } from "@/queries/auth";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/perfil/contrasena")({
    component: RouteComponent,
});

const entrance = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
} as const;

function RouteComponent() {
    const navigate = useNavigate();
    const updateMut = useMutation(updatePasswordOpts);

    const form = useForm({
        defaultValues: passwordFormDefaults,
        validators: { onChange: PasswordFormSchema },
        onSubmit: async ({ value }) => {
            try {
                await updateMut.mutateAsync({
                    currentPassword: value.currentPassword,
                    password: value.password,
                });
                toast.success("Contraseña actualizada", { closeButton: true });
                navigate({ to: "/panel/perfil" });
            } catch (e: any) {
                toast.error(e?.message || "Error al actualizar la contraseña", {
                    closeButton: true,
                });
            }
        },
    });

    return (
        <main className="bg-surface min-h-screen w-full p-6 lg:p-8">
            <div className="mx-auto max-w-3xl space-y-8">
                <motion.header
                    {...entrance}
                    className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
                >
                    <div className="space-y-1.5">
                        <Button
                            asChild
                            size="sm"
                            variant="ghost"
                            className="-ml-2 mb-1 text-muted-foreground"
                        >
                            <Link to="/panel/perfil">
                                <ArrowLeft className="size-4" />
                                Volver al perfil
                            </Link>
                        </Button>
                        <span className="text-primary text-xs font-semibold tracking-widest uppercase">
                            Mi cuenta
                        </span>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Cambiar contraseña
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-sm">
                            Elige una contraseña segura que no uses en otros sitios.
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
                                form="change-password-form"
                                disabled={!canSubmit || isSubmitting}
                            >
                                <Save className="size-4" />
                                {isSubmitting ? "Guardando..." : "Actualizar"}
                            </Button>
                        )}
                    </form.Subscribe>
                </motion.header>

                <motion.form
                    {...entrance}
                    transition={{ delay: 0.1 }}
                    id="change-password-form"
                    className="space-y-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <PasswordFormFields form={form} />
                </motion.form>
            </div>
        </main>
    );
}
