import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRoleBadge } from "@/components/panel/users/UserRoleBadge";
import { getProfileOpts } from "@/queries/auth";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
    Edit2,
    ImageIcon,
    KeyRound,
    Mail,
    Phone,
    User as UserIcon,
} from "lucide-react";
import { motion } from "motion/react";

export const Route = createFileRoute("/panel/perfil/")({
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

    return (
        <main className="bg-surface min-h-screen w-full p-6 lg:p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <motion.header
                    {...entrance}
                    className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
                >
                    <div className="space-y-1.5">
                        <span className="text-primary text-xs font-semibold tracking-widest uppercase">
                            Mi cuenta
                        </span>
                        <h1 className="text-3xl font-extrabold tracking-tight">
                            Mi perfil
                        </h1>
                        <p className="text-muted-foreground max-w-lg text-sm">
                            Consulta y administra los datos de tu cuenta.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline">
                            <Link to="/panel/perfil/contrasena">
                                <KeyRound className="size-4" />
                                Cambiar contraseña
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link to="/panel/perfil/editar">
                                <Edit2 className="size-4" />
                                Editar perfil
                            </Link>
                        </Button>
                    </div>
                </motion.header>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <motion.div {...entrance} transition={{ delay: 0.1 }}>
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <ImageIcon className="size-5" />
                                    Imagen
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center gap-4">
                                <div className="relative mx-auto aspect-square w-full max-w-40 overflow-hidden rounded-full border bg-surface-container-high">
                                    {user.img ? (
                                        <img
                                            src={`/static/uploads/${user.img}`}
                                            alt={user.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="grid h-full w-full place-items-center text-on-surface-variant">
                                            <UserIcon className="size-12" />
                                        </div>
                                    )}
                                </div>
                                <Button asChild size="sm" variant="ghost">
                                    <Link to="/panel/perfil/editar">
                                        Cambiar imagen
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        {...entrance}
                        transition={{ delay: 0.15 }}
                        className="md:col-span-2"
                    >
                        <Card className="h-full">
                            <CardHeader>
                                <div className="flex items-start justify-between gap-3">
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <UserIcon className="size-5" />
                                        Información de la cuenta
                                    </CardTitle>
                                    <UserRoleBadge role={user.role} />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5">
                                <InfoRow label="Nombre" value={user.name} />
                                <InfoRow
                                    label="Nombre de usuario"
                                    value={user.username ? `@${user.username}` : "—"}
                                />
                                <InfoRow
                                    icon={Mail}
                                    label="Email"
                                    value={user.email || "—"}
                                />
                                <InfoRow
                                    icon={Phone}
                                    label="Teléfono"
                                    value={user.phone || "—"}
                                />
                                <InfoRow
                                    icon={KeyRound}
                                    label="Contraseña"
                                    value="••••••••"
                                    action={
                                        <Button asChild size="sm" variant="ghost">
                                            <Link to="/panel/perfil/contrasena">
                                                Cambiar
                                            </Link>
                                        </Button>
                                    }
                                />
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}

function InfoRow({
    icon: Icon,
    label,
    value,
    action,
}: {
    icon?: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    action?: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-outline-variant/20 pb-3 last:border-none last:pb-0">
            <div className="flex min-w-0 items-center gap-3">
                {Icon ? (
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-container text-on-surface-variant">
                        <Icon className="size-4" />
                    </span>
                ) : null}
                <div className="min-w-0">
                    <p className="text-tiny tracking-[0.15em] uppercase text-outline font-bold">
                        {label}
                    </p>
                    <p className="text-sm font-semibold text-on-surface line-clamp-1">
                        {value}
                    </p>
                </div>
            </div>
            {action}
        </div>
    );
}
