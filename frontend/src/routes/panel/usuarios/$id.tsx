import { ProfileImageCard } from "@/components/dashboard/user/ProfileImageCard";
import { UserFormFields } from "@/components/dashboard/user/UserFormFields";
import {
    UserFormSchema,
    buildUserPayload,
    userToFormValues,
} from "@/components/dashboard/user/schema";
import { Button } from "@/components/ui/button";
import { getUserByIdOpts, updateUserOpts } from "@/queries/users";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/usuarios/$id")({
    component: RouteComponent,
    loader: async ({ context, params }) => {
        await context.queryClient.ensureQueryData(getUserByIdOpts(params.id));
    },
});

const entrance = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
} as const;

function RouteComponent() {
    const { id } = Route.useParams();
    const { data } = useSuspenseQuery(getUserByIdOpts(id));
    const user = data.user;

    const updateMut = useMutation(updateUserOpts(id));

    const form = useForm({
        defaultValues: userToFormValues(user),
        validators: { onChange: UserFormSchema },
        onSubmit: async ({ value }) => {
            try {
                await updateMut.mutateAsync({ ...buildUserPayload(value), id });
                toast.success("Usuario actualizado", { closeButton: true });
            } catch (e: any) {
                toast.error(e?.message || "Error al actualizar el usuario", {
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
                            Editar usuario
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-sm">
                            Modifica los datos del usuario.
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
                                form="edit-user-form"
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
                    id="edit-user-form"
                    className="space-y-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <UserFormFields form={form} mode="edit" />
                </motion.form>

                <motion.div {...entrance} transition={{ delay: 0.2 }}>
                    <ProfileImageCard
                        userId={id}
                        currentImg={user.img}
                    />
                </motion.div>
            </div>
        </main>
    );
}
