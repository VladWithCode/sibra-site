import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { getLoginOpts, getProfileOpts } from "@/queries/auth";
import type { TUserProfileResult } from "@/queries/type";
import { useUIStore } from "@/stores/uiStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

export const Route = createFileRoute("/_public/iniciar-sesion")({
    component: RouteComponent,
    beforeLoad: async ({ context }) => {
        let data: TUserProfileResult | null = null;
        try {
            data = await context.queryClient.fetchQuery(getProfileOpts);
        } catch (e) {
            console.error(e);
        }
        if (data !== null) {
            throw redirect({ to: "/panel" });
        }
    },
});

const loginSchema = z.object({
    username: z.string().min(2, "El nombre de usuario debe tener al menos 2 caracteres"),
    password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres"),
});

type loginSchemaType = z.infer<typeof loginSchema>;

function RouteComponent() {
    const router = useRouter();
    const { setHeaderFloating, setHeaderComplementProps } = useUIStore();
    const form = useForm<loginSchemaType>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: "",
            password: "",
        },
    });
    const signInMut = useMutation(getLoginOpts)
    const onSubmit = async (data: loginSchemaType) => {
        const result = await signInMut.mutateAsync(data);

        if (result.success) {
            router.history.push("/panel");
        }
    }

    useEffect(() => {
        setHeaderFloating(false);
        setHeaderComplementProps({ complementType: "none" });
    }, []);

    return (
        <div className="relative z-0 flex flex-col items-center justify-center bg-secondary px-3 py-32">
            <div className="w-full max-w-lg bg-white p-6 space-y-6 rounded-lg shadow">
                <div className="space-y-1">
                    <h1 className="text-4xl">Iniciar sesión</h1>
                    <p className="text-current/60">Accede a tu cuenta para continuar</p>
                </div>
                <Form {...form}>
                    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Usuario</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="text"
                                            className="bg-gray-50"
                                            placeholder="Usuario"
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contraseña</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            className="bg-gray-50"
                                            placeholder="Contraseña"
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <Button className="w-full text-base mt-6" type="submit" size="lg">
                            Iniciar sesión
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
}
