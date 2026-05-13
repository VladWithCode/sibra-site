import type { TBlogPostStatus } from "@/queries/type";

const CONFIG: Record<TBlogPostStatus, { label: string; className: string }> = {
    draft:     { label: "Borrador",   className: "bg-surface-container-high text-on-surface-variant border border-outline-variant/40" },
    published: { label: "Publicado",  className: "bg-sbr-green/10 text-sbr-green-dark border border-sbr-green/20" },
    archived:  { label: "Archivado",  className: "bg-surface-container text-on-surface-variant border border-outline-variant/30" },
};

export const BLOG_STATUS_OPTIONS: { value: TBlogPostStatus; label: string }[] = [
    { value: "draft",     label: "Borrador"  },
    { value: "published", label: "Publicado" },
    { value: "archived",  label: "Archivado" },
];

export function BlogStatusBadge({ status }: { status: TBlogPostStatus }) {
    const cfg = CONFIG[status] ?? CONFIG.draft;
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
            {cfg.label}
        </span>
    );
}
