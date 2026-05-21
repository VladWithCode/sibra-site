import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
    getAnalyticsStatsOpts,
    getAnalyticsHourlyOpts,
} from "@/queries/analytics";
import { Button } from "@/components/ui/button";
import {
    BarChart3,
    Eye,
    Users,
    TrendingUp,
    ArrowLeft,
    Calendar,
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

function AnalyticsPage() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [from, setFrom] = useState(formatDate(thirtyDaysAgo));
    const [to, setTo] = useState(formatDate(today));
    const [drillDownDate, setDrillDownDate] = useState<string | null>(null);

    const { data: stats, isLoading } = useQuery(
        getAnalyticsStatsOpts(from, to),
    );

    const { data: hourlyData, isLoading: hourlyLoading } = useQuery({
        ...getAnalyticsHourlyOpts(drillDownDate ?? ""),
        enabled: !!drillDownDate,
    });

    const avgPerDay =
        stats && stats.viewsPerDay.length > 0
            ? Math.round(stats.totalViews / stats.viewsPerDay.length)
            : 0;

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
                    Visitas, páginas más vistas y actividad del sitio web.
                </p>
            </div>

            {/* Date range picker */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-outline" />
                    <label className="text-sm text-on-surface-variant font-medium">
                        Desde
                    </label>
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="border border-outline-variant rounded-md px-3 py-1.5 text-sm bg-surface-container-lowest text-on-surface"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm text-on-surface-variant font-medium">
                        Hasta
                    </label>
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="border border-outline-variant rounded-md px-3 py-1.5 text-sm bg-surface-container-lowest text-on-surface"
                    />
                </div>
            </div>

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
                                    <BarChart
                                        data={padHourlyData(hourlyData)}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="var(--color-outline-variant, #ccc)"
                                            opacity={0.3}
                                        />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fontSize: 12 }}
                                        />
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
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            opacity={0.3}
                                        />
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
                                            tickFormatter={(d: string) =>
                                                d.slice(5)
                                            }
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fontSize: 12 }}
                                        />
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
                                                    if (date)
                                                        setDrillDownDate(date);
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
                    <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden mb-8">
                        <div className="px-5 py-4 border-b border-surface-container-low">
                            <h3 className="text-base font-extrabold text-on-surface tracking-tight">
                                Páginas más visitadas
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-surface-container-low text-left">
                                        <th className="px-5 py-3 font-bold text-outline text-tiny tracking-[0.15em] uppercase">
                                            Página
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
                                            <td className="px-5 py-3 font-medium text-on-surface">
                                                {page.path}
                                            </td>
                                            <td className="px-5 py-3 text-right text-on-surface-variant tabular-nums">
                                                {page.views.toLocaleString()}
                                            </td>
                                            <td className="px-5 py-3 text-right text-on-surface-variant tabular-nums">
                                                {stats.totalViews > 0
                                                    ? (
                                                          (page.views /
                                                              stats.totalViews) *
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
                                                No hay datos para el periodo
                                                seleccionado
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
            <span
                className={`size-9 grid place-items-center rounded-lg shrink-0 ${accent}`}
            >
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
