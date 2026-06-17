import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
    getAnalyticsStatsOpts,
    getAnalyticsHourlyOpts,
    getVisitsOpts,
    type TAnalyticsFilter,
    type TLabelCount,
    type TVisit,
} from "@/queries/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    BarChart3,
    Eye,
    Users,
    TrendingUp,
    ArrowLeft,
    Calendar,
    Search,
    X,
} from "lucide-react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/panel/analiticas/")({
    component: AnalyticsPage,
});

function formatDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

type SearchFields = {
    q: string;
    urls: string;
    source: string;
    site: string;
};

const emptySearch: SearchFields = { q: "", urls: "", source: "", site: "" };

function AnalyticsPage() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [from, setFrom] = useState(formatDate(thirtyDaysAgo));
    const [to, setTo] = useState(formatDate(today));
    const [drillDownDate, setDrillDownDate] = useState<string | null>(null);

    // Draft = what's typed; applied = what's actually queried (on submit).
    const [draft, setDraft] = useState<SearchFields>(emptySearch);
    const [applied, setApplied] = useState<SearchFields>(emptySearch);

    const filter: TAnalyticsFilter = useMemo(
        () => ({
            from,
            to,
            q: applied.q || undefined,
            urls: applied.urls || undefined,
            source: applied.source || undefined,
            site: applied.site || undefined,
        }),
        [from, to, applied],
    );

    const { data: stats, isLoading } = useQuery(getAnalyticsStatsOpts(filter));
    const { data: visits, isLoading: visitsLoading } = useQuery(getVisitsOpts(filter, 50, 0));

    const { data: hourlyData, isLoading: hourlyLoading } = useQuery({
        ...getAnalyticsHourlyOpts(drillDownDate ?? ""),
        enabled: !!drillDownDate,
    });

    const avgPerDay =
        stats && stats.viewsPerDay.length > 0
            ? Math.round(stats.totalViews / stats.viewsPerDay.length)
            : 0;

    const hasFilters = !!applied.q || !!applied.urls || !!applied.source || !!applied.site;

    function applySearch(e: React.FormEvent) {
        e.preventDefault();
        setApplied(draft);
    }

    function clearSearch() {
        setDraft(emptySearch);
        setApplied(emptySearch);
    }

    return (
        <main className="px-4 sm:px-6 lg:px-8">
            <div className="mb-8 lg:mb-10">
                <span className="inline-flex items-center gap-1.5 text-tiny tracking-[0.15em] uppercase text-sbr-blue font-bold">
                    <BarChart3 className="size-3" />
                    Analíticas
                </span>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-on-surface mt-1 tracking-tight">
                    Estadísticas del sitio
                </h2>
                <p className="text-sm text-on-surface-variant mt-1 max-w-xl">
                    Visitas, páginas más vistas y actividad del sitio web. Incluye visitas de
                    páginas externas.
                </p>
            </div>

            {/* Date range picker */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-outline" />
                    <label className="text-sm text-on-surface-variant font-medium">Desde</label>
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="border border-outline-variant rounded-md px-3 py-1.5 text-sm bg-surface-container-lowest text-on-surface"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-on-surface-variant font-medium">Hasta</label>
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="border border-outline-variant rounded-md px-3 py-1.5 text-sm bg-surface-container-lowest text-on-surface"
                    />
                </div>
            </div>

            {/* URL / source / site filters */}
            <form
                onSubmit={applySearch}
                className="bg-surface-container-lowest rounded-xl shadow-sm p-4 mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
                <div className="flex flex-col gap-1.5 lg:col-span-2">
                    <label className="text-tiny tracking-[0.12em] uppercase text-outline font-bold">
                        Buscar URL (parcial)
                    </label>
                    <Input
                        type="text"
                        placeholder="/propiedades, landing, /blog/..."
                        value={draft.q}
                        onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
                    />
                </div>
                <div className="flex flex-col gap-1.5 lg:col-span-2">
                    <label className="text-tiny tracking-[0.12em] uppercase text-outline font-bold">
                        URLs exactas (separadas por coma)
                    </label>
                    <Input
                        type="text"
                        placeholder="/, /contacto, https://landing.mx/promo"
                        value={draft.urls}
                        onChange={(e) => setDraft((d) => ({ ...d, urls: e.target.value }))}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-tiny tracking-[0.12em] uppercase text-outline font-bold">
                        Source
                    </label>
                    <Input
                        type="text"
                        placeholder="landing-externa"
                        value={draft.source}
                        onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-tiny tracking-[0.12em] uppercase text-outline font-bold">
                        Site
                    </label>
                    <Input
                        type="text"
                        placeholder="sibra-landing"
                        value={draft.site}
                        onChange={(e) => setDraft((d) => ({ ...d, site: e.target.value }))}
                    />
                </div>
                <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
                    <Button type="submit" className="gap-1.5">
                        <Search className="size-4" />
                        Buscar
                    </Button>
                    {hasFilters && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="gap-1.5"
                            onClick={clearSearch}
                        >
                            <X className="size-4" />
                            Limpiar
                        </Button>
                    )}
                </div>
            </form>

            {isLoading ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-28 rounded-xl bg-surface-container animate-pulse"
                            />
                        ))}
                    </div>
                    <div className="h-80 rounded-xl bg-surface-container animate-pulse" />
                </div>
            ) : stats ? (
                <>
                    {/* Stat cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <StatCard
                            icon={Eye}
                            label="Visitas totales"
                            value={stats.totalViews}
                            accent="text-sbr-blue bg-sbr-blue/10"
                        />
                        <StatCard
                            icon={Users}
                            label="Visitantes únicos"
                            value={stats.uniqueSessions}
                            accent="text-sbr-green bg-sbr-green/10"
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Promedio por día"
                            value={avgPerDay}
                            accent="text-amber-600 bg-amber-100"
                        />
                    </div>

                    {/* Views per day chart */}
                    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-5 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-extrabold text-on-surface tracking-tight">
                                {drillDownDate
                                    ? `Visitas por hora — ${drillDownDate}`
                                    : "Visitas por día"}
                            </h3>
                            {drillDownDate && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1.5"
                                    onClick={() => setDrillDownDate(null)}
                                >
                                    <ArrowLeft className="size-3.5" />
                                    Volver
                                </Button>
                            )}
                        </div>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                {drillDownDate && hourlyData ? (
                                    <BarChart data={padHourlyData(hourlyData)}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="var(--color-outline-variant, #ccc)"
                                            opacity={0.3}
                                        />
                                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Bar
                                            dataKey="views"
                                            fill="var(--color-sbr-blue, #3b82f6)"
                                            radius={[4, 4, 0, 0]}
                                            name="Visitas"
                                        />
                                    </BarChart>
                                ) : drillDownDate && hourlyLoading ? (
                                    <BarChart data={[]}>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    </BarChart>
                                ) : (
                                    <LineChart data={stats.viewsPerDay}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="var(--color-outline-variant, #ccc)"
                                            opacity={0.3}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(d: string) => d.slice(5)}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="views"
                                            stroke="var(--color-sbr-blue, #3b82f6)"
                                            strokeWidth={2}
                                            dot={{
                                                r: 4,
                                                cursor: "pointer",
                                            }}
                                            activeDot={{
                                                r: 6,
                                                cursor: "pointer",
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                onClick: (_: any, data: any) => {
                                                    const date = data?.payload?.date;
                                                    if (date) setDrillDownDate(date);
                                                },
                                            }}
                                            name="Visitas"
                                        />
                                    </LineChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                        {!drillDownDate && (
                            <p className="text-xs text-outline mt-2 text-center">
                                Click en un punto para ver el desglose por hora
                            </p>
                        )}
                    </div>

                    {/* Top pages */}
                    <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden mb-6">
                        <div className="px-5 py-4 border-b border-surface-container-low">
                            <h3 className="text-base font-extrabold text-on-surface tracking-tight">
                                Visitas por URL
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-surface-container-low text-left">
                                        <th className="px-5 py-3 font-bold text-outline text-tiny tracking-[0.15em] uppercase">
                                            URL
                                        </th>
                                        <th className="px-5 py-3 font-bold text-outline text-tiny tracking-[0.15em] uppercase text-right">
                                            Visitas
                                        </th>
                                        <th className="px-5 py-3 font-bold text-outline text-tiny tracking-[0.15em] uppercase text-right">
                                            % del total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.topPages.map((page) => (
                                        <tr
                                            key={page.path}
                                            className="border-b border-surface-container-low last:border-0 hover:bg-surface-bright transition-colors"
                                        >
                                            <td className="px-5 py-3 font-medium text-on-surface break-all">
                                                {page.path}
                                            </td>
                                            <td className="px-5 py-3 text-right text-on-surface-variant tabular-nums">
                                                {page.views.toLocaleString()}
                                            </td>
                                            <td className="px-5 py-3 text-right text-on-surface-variant tabular-nums">
                                                {stats.totalViews > 0
                                                    ? (
                                                          (page.views / stats.totalViews) *
                                                          100
                                                      ).toFixed(1)
                                                    : 0}
                                                %
                                            </td>
                                        </tr>
                                    ))}
                                    {stats.topPages.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-5 py-8 text-center text-outline"
                                            >
                                                No hay datos para el periodo seleccionado
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Breakdown: referrers, source, site */}
                    <div className="grid gap-4 lg:grid-cols-3 mb-6">
                        <LabelCountCard
                            title="Referrers"
                            rows={stats.topReferrers}
                            badgeVariant="outline"
                        />
                        <LabelCountCard
                            title="Por source"
                            rows={stats.bySource}
                            badgeVariant="secondary"
                        />
                        <LabelCountCard
                            title="Por site"
                            rows={stats.bySite}
                            badgeVariant="default"
                        />
                    </div>

                    {/* Latest visits */}
                    <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden mb-8">
                        <div className="px-5 py-4 border-b border-surface-container-low">
                            <h3 className="text-base font-extrabold text-on-surface tracking-tight">
                                Últimas visitas
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-surface-container-low text-left">
                                        <th className="px-5 py-3 font-bold text-outline text-tiny tracking-[0.15em] uppercase">
                                            Fecha
                                        </th>
                                        <th className="px-5 py-3 font-bold text-outline text-tiny tracking-[0.15em] uppercase">
                                            URL
                                        </th>
                                        <th className="px-5 py-3 font-bold text-outline text-tiny tracking-[0.15em] uppercase">
                                            Site / Source
                                        </th>
                                        <th className="px-5 py-3 font-bold text-outline text-tiny tracking-[0.15em] uppercase">
                                            Referrer
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visitsLoading ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-5 py-8 text-center text-outline"
                                            >
                                                Cargando…
                                            </td>
                                        </tr>
                                    ) : visits && visits.length > 0 ? (
                                        visits.map((v) => <VisitRow key={v.id} visit={v} />)
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-5 py-8 text-center text-outline"
                                            >
                                                No hay visitas para los filtros seleccionados
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : null}
        </main>
    );
}

function VisitRow({ visit }: { visit: TVisit }) {
    const url = visit.url || visit.path;
    return (
        <tr className="border-b border-surface-container-low last:border-0 hover:bg-surface-bright transition-colors align-top">
            <td className="px-5 py-3 text-on-surface-variant whitespace-nowrap tabular-nums">
                {new Date(visit.createdAt).toLocaleString("es-MX", {
                    dateStyle: "short",
                    timeStyle: "short",
                })}
            </td>
            <td className="px-5 py-3 text-on-surface max-w-xs">
                <span className="font-medium break-all">{url}</span>
                {visit.title && (
                    <span className="block text-xs text-outline break-all">{visit.title}</span>
                )}
            </td>
            <td className="px-5 py-3">
                <div className="flex flex-wrap gap-1">
                    {visit.site && <Badge variant="default">{visit.site}</Badge>}
                    {visit.source && <Badge variant="secondary">{visit.source}</Badge>}
                    {!visit.site && !visit.source && <span className="text-outline">—</span>}
                </div>
            </td>
            <td className="px-5 py-3 text-on-surface-variant max-w-xs break-all">
                {visit.referrer || "—"}
            </td>
        </tr>
    );
}

function LabelCountCard({
    title,
    rows,
    badgeVariant,
}: {
    title: string;
    rows: TLabelCount[];
    badgeVariant: "default" | "secondary" | "outline";
}) {
    return (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-container-low">
                <h3 className="text-base font-extrabold text-on-surface tracking-tight">
                    {title}
                </h3>
            </div>
            <ul className="divide-y divide-surface-container-low">
                {rows.length > 0 ? (
                    rows.map((r) => (
                        <li
                            key={r.label}
                            className="flex items-center justify-between gap-3 px-5 py-2.5"
                        >
                            <Badge variant={badgeVariant} className="max-w-[14rem] truncate">
                                {r.label}
                            </Badge>
                            <span className="text-sm text-on-surface-variant tabular-nums shrink-0">
                                {r.views.toLocaleString()}
                            </span>
                        </li>
                    ))
                ) : (
                    <li className="px-5 py-6 text-center text-outline text-sm">Sin datos</li>
                )}
            </ul>
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    accent,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
    accent: string;
}) {
    return (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-4 flex flex-col gap-3">
            <span className={`size-9 grid place-items-center rounded-lg shrink-0 ${accent}`}>
                <Icon className="size-4" />
            </span>
            <div>
                <p className="text-tiny tracking-[0.15em] uppercase text-outline font-bold">
                    {label}
                </p>
                <p className="text-2xl lg:text-3xl font-extrabold text-on-surface mt-1 tracking-tight tabular-nums">
                    {value.toLocaleString()}
                </p>
            </div>
        </div>
    );
}

function padHourlyData(data: { hour: number; views: number }[]) {
    const map = new Map(data.map((d) => [d.hour, d.views]));
    return Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        label: `${i.toString().padStart(2, "0")}:00`,
        views: map.get(i) ?? 0,
    }));
}
