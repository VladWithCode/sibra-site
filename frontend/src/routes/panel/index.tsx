import { Button } from '@/components/ui/button';
import { ImgPlaceholder } from '@/components/ui/img-placeholder';
import { PropertyStatusBadge } from '@/components/panel/properties/PropertyStatusBadge';
import { RequestStatusBadge } from '@/components/panel/requests/RequestStatusBadge';
import { FormatMoney } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getProfileOpts } from '@/queries/auth';
import { getPropertyFilteredListingOpts } from '@/queries/properties';
import { getProjectsOpts } from '@/queries/projects';
import { getQuotesOpts } from '@/queries/quotes';
import type { TContactRequestType, TProperty, TQuote } from '@/queries/type';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import {
    ArrowRight,
    Calendar,
    CalendarPlus,
    ClipboardList,
    Home,
    LayoutDashboard,
    Map,
    Plus,
    Sparkles,
    UserPlus,
    Users,
} from 'lucide-react';

export const Route = createFileRoute('/panel/')({
    component: RouteComponent,
    loader: async ({ context }) => {
        await Promise.allSettled([
            context.queryClient.ensureQueryData(
                getPropertyFilteredListingOpts({ perPage: 5, page: 1 }),
            ),
            context.queryClient.ensureQueryData(getProjectsOpts),
            context.queryClient.ensureQueryData(getQuotesOpts({ perPage: 5, page: 1 })),
            context.queryClient.ensureQueryData(getQuotesOpts({ status: 'pendiente', perPage: 1 })),
        ]);
    },
});

const REQUEST_TYPE_LABEL: Record<TContactRequestType, string> = {
    informacion: 'Información',
    cita: 'Cita',
    venta: 'Venta',
    precalificacion: 'Precalificación',
    proyecto: 'Proyecto',
};

const QUICK_ACTION_CARD_CLS =
    'group bg-surface-container-lowest rounded-xl shadow-sm border border-transparent hover:border-sbr-blue/20 hover:shadow-md transition-all p-4 flex flex-col gap-3';

const STAT_CARD_CLS =
    'group bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md transition-all p-4 flex flex-col gap-3 min-h-[7rem]';

function RouteComponent() {
    const { data: profile } = useQuery(getProfileOpts);
    const { data: propsData, isLoading: propsLoading } = useQuery(
        getPropertyFilteredListingOpts({ perPage: 5, page: 1 }),
    );
    const { data: projectsData, isLoading: projectsLoading } = useQuery(getProjectsOpts);
    const { data: requestsData, isLoading: requestsLoading } = useQuery(
        getQuotesOpts({ perPage: 5, page: 1 }),
    );
    const { data: pendingData } = useQuery(getQuotesOpts({ status: 'pendiente', perPage: 1 }));

    const firstName = (profile?.user?.name || '').trim().split(' ')[0] || '';
    const totalProperties = propsData?.pagination?.total ?? 0;
    const totalProjects = projectsData?.projects?.length ?? 0;
    const pendingRequests = pendingData?.pagination?.total ?? 0;
    const totalRequests = requestsData?.pagination?.total ?? 0;
    const recentProperties = propsData?.properties ?? [];
    const recentRequests = requestsData?.requests ?? [];

    return (
        <main className="px-4 sm:px-6 lg:px-8">
            <DashboardWelcome firstName={firstName} role={profile?.user?.role} />

            <section className="mb-8 lg:mb-10">
                <SectionHeader
                    eyebrow="Inicio"
                    title="Accesos rápidos"
                    description="Las acciones que sueles realizar primero al entrar al panel."
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Link to="/panel/propiedades/nueva" className={QUICK_ACTION_CARD_CLS}>
                        <QuickActionContent
                            icon={Home}
                            accent="text-sbr-blue bg-sbr-blue/10"
                            label="Nueva propiedad"
                            description="Publica casas, apartamentos o terrenos en venta o renta."
                        />
                    </Link>
                    <Link to="/panel/proyectos/nuevo" className={QUICK_ACTION_CARD_CLS}>
                        <QuickActionContent
                            icon={Map}
                            accent="text-sbr-blue-light bg-sbr-blue-light/10"
                            label="Nuevo proyecto"
                            description="Suma un desarrollo nuevo al catálogo de la inmobiliaria."
                        />
                    </Link>
                    <Link to="/panel/citas" className={QUICK_ACTION_CARD_CLS}>
                        <QuickActionContent
                            icon={CalendarPlus}
                            accent="text-sbr-green bg-sbr-green/10"
                            label="Citas y contacto"
                            description="Atiende solicitudes, agenda visitas y haz seguimiento."
                        />
                    </Link>
                    <Link to="/panel/usuarios/nuevo" className={QUICK_ACTION_CARD_CLS}>
                        <QuickActionContent
                            icon={UserPlus}
                            accent="text-sbr-blue-dark bg-sbr-blue-dark/10"
                            label="Nuevo usuario"
                            description="Da de alta agentes y administradores del panel."
                        />
                    </Link>
                </div>
            </section>

            <section className="mb-8 lg:mb-10">
                <SectionHeader
                    eyebrow="Resumen"
                    title="Tu inmobiliaria de un vistazo"
                    description="Cifras actualizadas del inventario y la actividad reciente."
                />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Link to="/panel/propiedades" className={STAT_CARD_CLS}>
                        <StatContent
                            label="Propiedades"
                            value={totalProperties}
                            icon={Home}
                            accent="text-sbr-blue bg-sbr-blue/10"
                            loading={propsLoading}
                        />
                    </Link>
                    <Link to="/panel/proyectos" className={STAT_CARD_CLS}>
                        <StatContent
                            label="Proyectos"
                            value={totalProjects}
                            icon={Map}
                            accent="text-sbr-blue-light bg-sbr-blue-light/10"
                            loading={projectsLoading}
                        />
                    </Link>
                    <Link to="/panel/citas" className={STAT_CARD_CLS}>
                        <StatContent
                            label="Citas pendientes"
                            value={pendingRequests}
                            icon={Calendar}
                            accent="text-amber-600 bg-amber-100"
                            helper={totalRequests > 0 ? `${totalRequests} en total` : undefined}
                        />
                    </Link>
                    <Link to="/panel/asociados" className={STAT_CARD_CLS}>
                        <StatContent
                            label="Asociados"
                            value={null}
                            icon={Users}
                            accent="text-sbr-green bg-sbr-green/10"
                            helper="Buscar por RFC o CURP"
                        />
                    </Link>
                </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                <RecentRequestsCard requests={recentRequests} loading={requestsLoading} />
                <RecentPropertiesCard
                    properties={recentProperties}
                    loading={propsLoading}
                />
            </div>
        </main>
    );
}

function DashboardWelcome({
    firstName,
    role,
}: {
    firstName: string;
    role: string | undefined;
}) {
    const greeting = (() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 19) return 'Buenas tardes';
        return 'Buenas noches';
    })();

    const roleLabel =
        role === 'admin' ? 'Administrador' : role === 'editor' ? 'Editor' : 'Equipo';

    return (
        <div className="mb-8 lg:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
                <span className="inline-flex items-center gap-1.5 text-tiny tracking-[0.15em] uppercase text-sbr-blue font-bold">
                    <Sparkles className="size-3" />
                    {roleLabel}
                </span>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-on-surface mt-1 tracking-tight">
                    {greeting}
                    {firstName ? `, ${firstName}` : ''}
                </h2>
                <p className="text-sm text-on-surface-variant mt-1 max-w-xl">
                    Aquí tienes un resumen de tu inventario, las solicitudes recientes y los
                    accesos directos a las tareas más comunes.
                </p>
            </div>
            <Button asChild size="sm" variant="outline" className="gap-2 self-start sm:self-auto">
                <Link to="/panel/propiedades">
                    <LayoutDashboard className="size-4" />
                    Ver inventario
                </Link>
            </Button>
        </div>
    );
}

function SectionHeader({
    eyebrow,
    title,
    description,
}: {
    eyebrow: string;
    title: string;
    description?: string;
}) {
    return (
        <div className="mb-4 lg:mb-5">
            <span className="block text-tiny tracking-[0.15em] uppercase text-sbr-blue font-bold">
                {eyebrow}
            </span>
            <h3 className="text-lg lg:text-xl font-extrabold text-on-surface mt-1 tracking-tight">
                {title}
            </h3>
            {description ? (
                <p className="text-xs text-outline mt-1">{description}</p>
            ) : null}
        </div>
    );
}

function QuickActionContent({
    icon: Icon,
    accent,
    label,
    description,
}: {
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    label: string;
    description: string;
}) {
    return (
        <>
            <div className="flex items-start justify-between">
                <span
                    className={cn(
                        'size-10 grid place-items-center rounded-lg shrink-0',
                        accent,
                    )}
                >
                    <Icon className="size-5" />
                </span>
                <Plus className="size-4 text-outline group-hover:text-sbr-blue transition-colors" />
            </div>
            <div>
                <p className="text-sm font-bold text-on-surface">{label}</p>
                <p className="text-xs text-outline mt-0.5 line-clamp-2">{description}</p>
            </div>
        </>
    );
}

function StatContent({
    label,
    value,
    icon: Icon,
    accent,
    helper,
    loading,
}: {
    label: string;
    value: number | null;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    helper?: string;
    loading?: boolean;
}) {
    return (
        <>
            <div className="flex items-center justify-between">
                <span
                    className={cn(
                        'size-9 grid place-items-center rounded-lg shrink-0',
                        accent,
                    )}
                >
                    <Icon className="size-4" />
                </span>
                <ArrowRight className="size-4 text-outline group-hover:text-sbr-blue group-hover:translate-x-0.5 transition-all" />
            </div>
            <div>
                <p className="text-tiny tracking-[0.15em] uppercase text-outline font-bold">
                    {label}
                </p>
                {loading ? (
                    <div className="h-8 w-16 bg-surface-container animate-pulse rounded mt-1" />
                ) : (
                    <p className="text-2xl lg:text-3xl font-extrabold text-on-surface mt-1 tracking-tight">
                        {value ?? '—'}
                    </p>
                )}
                {helper ? <p className="text-[11px] text-outline mt-0.5">{helper}</p> : null}
            </div>
        </>
    );
}

function RecentRequestsCard({
    requests,
    loading,
}: {
    requests: TQuote[];
    loading?: boolean;
}) {
    return (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-end justify-between gap-3 px-5 py-4 border-b border-surface-container-low">
                <div>
                    <span className="block text-tiny tracking-[0.15em] uppercase text-sbr-blue font-bold">
                        Actividad
                    </span>
                    <h3 className="text-base lg:text-lg font-extrabold text-on-surface mt-0.5 tracking-tight">
                        Solicitudes recientes
                    </h3>
                </div>
                <Button asChild size="sm" variant="ghost" className="gap-1.5">
                    <Link to="/panel/citas">
                        Ver todas
                        <ArrowRight className="size-3.5" />
                    </Link>
                </Button>
            </div>
            <div className="p-3 sm:p-4 flex-1">
                {loading ? (
                    <ListSkeleton rows={4} />
                ) : requests.length === 0 ? (
                    <EmptyState
                        icon={ClipboardList}
                        title="Sin solicitudes"
                        description="Cuando los clientes contacten desde la web, aparecerán aquí."
                    />
                ) : (
                    <ul className="divide-y divide-surface-container-low">
                        {requests.map((r) => (
                            <li key={r.id}>
                                <Link
                                    to="/panel/citas/$id"
                                    params={{ id: r.id }}
                                    className="group flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-surface-bright transition-colors"
                                >
                                    <div className="size-9 rounded-full bg-sbr-blue/10 text-sbr-blue grid place-items-center text-xs font-bold shrink-0">
                                        {(r.name || '?').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-on-surface line-clamp-1 group-hover:text-sbr-blue">
                                            {r.name || 'Sin nombre'}
                                        </p>
                                        <p className="text-[11px] text-outline line-clamp-1">
                                            {REQUEST_TYPE_LABEL[r.type]} · {r.phone || 'Sin teléfono'}
                                        </p>
                                    </div>
                                    <RequestStatusBadge status={r.status} className="shrink-0" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function RecentPropertiesCard({
    properties,
    loading,
}: {
    properties: TProperty[];
    loading?: boolean;
}) {
    return (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-end justify-between gap-3 px-5 py-4 border-b border-surface-container-low">
                <div>
                    <span className="block text-tiny tracking-[0.15em] uppercase text-sbr-blue font-bold">
                        Inventario
                    </span>
                    <h3 className="text-base lg:text-lg font-extrabold text-on-surface mt-0.5 tracking-tight">
                        Propiedades recientes
                    </h3>
                </div>
                <Button asChild size="sm" variant="ghost" className="gap-1.5">
                    <Link to="/panel/propiedades">
                        Ver todas
                        <ArrowRight className="size-3.5" />
                    </Link>
                </Button>
            </div>
            <div className="p-3 sm:p-4 flex-1">
                {loading ? (
                    <ListSkeleton rows={4} />
                ) : properties.length === 0 ? (
                    <EmptyState
                        icon={Home}
                        title="Sin propiedades"
                        description="Agrega tu primera propiedad para verla en el inventario."
                        cta={
                            <Button asChild size="sm" className="gap-2 mt-4">
                                <Link to="/panel/propiedades/nueva">
                                    <Plus className="size-4" />
                                    Nueva propiedad
                                </Link>
                            </Button>
                        }
                    />
                ) : (
                    <ul className="divide-y divide-surface-container-low">
                        {properties.map((p) => (
                            <li key={p.id}>
                                <PropertyMiniRow property={p} />
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function PropertyMiniRow({ property }: { property: TProperty }) {
    const imgSrc = property.mainImg
        ? `/static/properties/${property.id}/${property.mainImg}`
        : undefined;
    return (
        <Link
            to="/panel/propiedades/$id"
            params={{ id: property.id }}
            className="group flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-surface-bright transition-colors"
        >
            <div className="w-14 h-12 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={property.address}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <ImgPlaceholder className="w-full h-full" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-on-surface line-clamp-1 group-hover:text-sbr-blue">
                    {property.address || 'Sin dirección'}
                </p>
                <p className="text-[11px] text-outline line-clamp-1">
                    {[property.city, property.state].filter(Boolean).join(', ') ||
                        'Sin ubicación'}
                </p>
            </div>
            <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <p className="text-sm font-bold text-sbr-blue">
                    {FormatMoney(property.price)}
                </p>
                <PropertyStatusBadge status={property.status} />
            </div>
            <div className="sm:hidden shrink-0">
                <PropertyStatusBadge status={property.status} />
            </div>
        </Link>
    );
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="h-12 rounded-lg bg-surface-container animate-pulse"
                />
            ))}
        </div>
    );
}

function EmptyState({
    icon: Icon,
    title,
    description,
    cta,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    cta?: React.ReactNode;
}) {
    return (
        <div className="text-center py-8 px-4">
            <div className="size-10 rounded-full bg-surface-container grid place-items-center mx-auto mb-3 text-outline">
                <Icon className="size-5" />
            </div>
            <p className="text-sm font-semibold text-on-surface">{title}</p>
            <p className="text-xs text-outline mt-1 max-w-xs mx-auto">{description}</p>
            {cta}
        </div>
    );
}
