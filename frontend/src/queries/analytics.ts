import { queryOptions } from "@tanstack/react-query";

export const AnalyticsQueryKeys = {
    all: () => ["analytics"] as const,
    stats: (from: string, to: string) =>
        [...AnalyticsQueryKeys.all(), "stats", { from, to }] as const,
    hourly: (date: string) =>
        [...AnalyticsQueryKeys.all(), "hourly", date] as const,
} as const;

export type TAnalyticsStats = {
    totalViews: number;
    uniqueSessions: number;
    viewsPerDay: { date: string; views: number }[];
    topPages: { path: string; views: number }[];
};

export type THourlyStats = {
    hour: number;
    views: number;
}[];

export const getAnalyticsStatsOpts = (from: string, to: string) =>
    queryOptions({
        queryKey: AnalyticsQueryKeys.stats(from, to),
        queryFn: () => getAnalyticsStats(from, to),
    });

export const getAnalyticsHourlyOpts = (date: string) =>
    queryOptions({
        queryKey: AnalyticsQueryKeys.hourly(date),
        queryFn: () => getAnalyticsHourly(date),
    });

async function getAnalyticsStats(
    from: string,
    to: string,
): Promise<TAnalyticsStats> {
    const res = await fetch(
        `/api/analytics/stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Error al obtener estadísticas");
    }
    return data.stats;
}

async function getAnalyticsHourly(date: string): Promise<THourlyStats> {
    const res = await fetch(
        `/api/analytics/stats/hourly?date=${encodeURIComponent(date)}`,
    );
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Error al obtener datos por hora");
    }
    return data.viewsPerHour;
}
