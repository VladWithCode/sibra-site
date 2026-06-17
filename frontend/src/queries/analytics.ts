import { queryOptions } from "@tanstack/react-query";

export type TAnalyticsFilter = {
    from: string;
    to: string;
    url?: string;
    urls?: string; // comma-separated list
    q?: string; // partial URL/title search
    source?: string;
    site?: string;
};

export const AnalyticsQueryKeys = {
    all: () => ["analytics"] as const,
    stats: (filter: TAnalyticsFilter) =>
        [...AnalyticsQueryKeys.all(), "stats", filter] as const,
    visits: (filter: TAnalyticsFilter, limit: number, offset: number) =>
        [...AnalyticsQueryKeys.all(), "visits", filter, { limit, offset }] as const,
    hourly: (date: string) => [...AnalyticsQueryKeys.all(), "hourly", date] as const,
} as const;

export type TLabelCount = { label: string; views: number };

export type TAnalyticsStats = {
    totalViews: number;
    uniqueSessions: number;
    viewsPerDay: { date: string; views: number }[];
    topPages: { path: string; views: number }[];
    topReferrers: TLabelCount[];
    bySource: TLabelCount[];
    bySite: TLabelCount[];
};

export type TVisit = {
    id: string;
    path: string;
    url: string;
    title: string;
    referrer: string;
    source: string;
    site: string;
    sessionId: string;
    visitorId: string;
    origin: string;
    createdAt: string;
};

export type THourlyStats = {
    hour: number;
    views: number;
}[];

function toParams(filter: TAnalyticsFilter, extra?: Record<string, string | number>): string {
    const p = new URLSearchParams();
    p.set("from", filter.from);
    p.set("to", filter.to);
    if (filter.url) p.set("url", filter.url);
    if (filter.urls) p.set("urls", filter.urls);
    if (filter.q) p.set("q", filter.q);
    if (filter.source) p.set("source", filter.source);
    if (filter.site) p.set("site", filter.site);
    if (extra) {
        for (const [k, v] of Object.entries(extra)) p.set(k, String(v));
    }
    return p.toString();
}

export const getAnalyticsStatsOpts = (filter: TAnalyticsFilter) =>
    queryOptions({
        queryKey: AnalyticsQueryKeys.stats(filter),
        queryFn: () => getAnalyticsStats(filter),
    });

export const getVisitsOpts = (filter: TAnalyticsFilter, limit = 50, offset = 0) =>
    queryOptions({
        queryKey: AnalyticsQueryKeys.visits(filter, limit, offset),
        queryFn: () => getVisits(filter, limit, offset),
    });

export const getAnalyticsHourlyOpts = (date: string) =>
    queryOptions({
        queryKey: AnalyticsQueryKeys.hourly(date),
        queryFn: () => getAnalyticsHourly(date),
    });

async function getAnalyticsStats(filter: TAnalyticsFilter): Promise<TAnalyticsStats> {
    const res = await fetch(`/api/analytics/stats?${toParams(filter)}`);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Error al obtener estadísticas");
    }
    return data.stats;
}

async function getVisits(
    filter: TAnalyticsFilter,
    limit: number,
    offset: number,
): Promise<TVisit[]> {
    const res = await fetch(`/api/analytics/visits?${toParams(filter, { limit, offset })}`);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Error al obtener visitas");
    }
    return data.visits ?? [];
}

async function getAnalyticsHourly(date: string): Promise<THourlyStats> {
    const res = await fetch(`/api/analytics/stats/hourly?date=${encodeURIComponent(date)}`);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Error al obtener datos por hora");
    }
    return data.viewsPerHour;
}
