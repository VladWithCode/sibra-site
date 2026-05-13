import { cn } from "@/lib/utils";
import { List } from "lucide-react";
import { useState } from "react";
import type { TocEntry } from "./BlogMarkdown";

interface Props {
    entries: TocEntry[];
    className?: string;
}

// Minimum headings required to show the ToC
const MIN_ENTRIES = 2;

export function BlogToC({ entries, className }: Props) {
    const [open, setOpen] = useState(false);

    if (entries.length < MIN_ENTRIES) return null;

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <nav
            aria-label="Tabla de contenidos"
            className={cn(
                "rounded-xl border border-outline-variant/20 bg-surface-container-lowest overflow-hidden",
                className,
            )}
        >
            {/* Header / toggle on mobile */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container/50 transition-colors md:cursor-default"
            >
                <span className="flex items-center gap-2">
                    <List className="size-4 text-sbr-blue shrink-0" />
                    Contenido
                </span>
                {/* Chevron — only visible on mobile */}
                <svg
                    className={`size-4 text-outline transition-transform md:hidden ${open ? "rotate-180" : ""}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {/* Entry list — always visible on md+, toggled on mobile */}
            <ul
                className={`border-t border-outline-variant/10 py-2 md:block ${open ? "block" : "hidden"}`}
            >
                {entries.map((entry) => (
                    <li key={entry.id}>
                        <button
                            type="button"
                            onClick={() => scrollTo(entry.id)}
                            className={cn(
                                "w-full text-left px-4 py-1.5 text-sm leading-snug transition-colors hover:text-sbr-blue hover:bg-surface-container/50",
                                entry.level === 2
                                    ? "text-on-surface font-medium"
                                    : "text-on-surface-variant pl-7 text-[13px]",
                            )}
                        >
                            {entry.text}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
