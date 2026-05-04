import { ProfileFormFields } from "@/components/dashboard/profile/ProfileFormFields";
import { ProfileImageSelfCard } from "@/components/dashboard/profile/ProfileImageSelfCard";
import {
    ProfileFormSchema,
    buildProfilePayload,
    userToProfileValues,
} from "@/components/dashboard/profile/schema";
import { Button } from "@/components/ui/button";
import { getProfileOpts, updateProfileOpts } from "@/queries/auth";
import { useForm } from "@tanstack/react-form";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Save } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/perfil/editar")({
    component: RouteComponent,
});

const entrance = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
} as const;

function RouteComponent() {
    const { data } = useSuspenseQuery(getProfileOpts);
    const user = data.user;

    const updateMut = useMutation(updateProfileOpts);

    const form = useForm({
        defaultValues: userToProfileValues(user),
        validators: { onChange: ProfileFormSchema },
        onSubmit: async ({ value }) => {
            try {
                await updateMut.mutateAsync(buildProfilePayload(value));
                toast.success("Perfil actualizado", { closeButton: true });
            } catch (e: any) {
                toast.error(e?.message || "Error al actualizar el perfil", {
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
                            Editar perfil
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-sm">
                            Actualiza tus datos personales y tu imagen de perfil.
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
                                form="edit-profile-form"
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
                    id="edit-profile-form"
                    className="space-y-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <ProfileFormFields form={form} />
                </motion.form>

                <motion.div {...entrance} transition={{ delay: 0.2 }}>
                    <ProfileImageSelfCard currentImg={user.img} />
                </motion.div>
            </div>
        </main>
    );
}
