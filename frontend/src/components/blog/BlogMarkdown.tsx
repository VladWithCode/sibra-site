import ReactMarkdown from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { useMemo, useRef } from "react";
import { BlogCta } from "./BlogCta";

// ── Shortcode token ────────────────────────────────────────────────────────────
// Authors write [[cta-contacto]] anywhere in the Markdown source.
// We split the raw string on this token before passing to ReactMarkdown so the
// CTA renders as a real React component, not as escaped text.
const CTA_TOKEN = "[[cta-contacto]]";

// ── Sanitization schema ────────────────────────────────────────────────────────
// Extend the default rehype-sanitize schema to allow id attributes on headings
// (needed for ToC anchor links) and target/rel on anchors.
const sanitizeSchema = {
    ...defaultSchema,
    attributes: {
        ...defaultSchema.attributes,
        "*": [...(defaultSchema.attributes?.["*"] ?? []), "id", "className"],
        a: [
            ...(defaultSchema.attributes?.a ?? []),
            "target",
            "rel",
            "href",
        ],
        img: [
            ...(defaultSchema.attributes?.img ?? []),
            "src",
            "alt",
            "width",
            "height",
            "loading",
        ],
        code: [...(defaultSchema.attributes?.code ?? []), "className"],
        pre:  [...(defaultSchema.attributes?.pre  ?? []), "className"],
    },
};

// ── Slug generator — same logic as backend blogSlugify ────────────────────────
export function headingToId(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80);
}

// ── ToC extraction ─────────────────────────────────────────────────────────────
export interface TocEntry {
    level: 2 | 3;
    text: string;
    id: string;
}

export function extractToc(markdown: string): TocEntry[] {
    const lines = markdown.split("\n");
    const entries: TocEntry[] = [];
    const seenIds = new Map<string, number>();

    for (const line of lines) {
        const m2 = line.match(/^##\s+(.+)$/);
        const m3 = line.match(/^###\s+(.+)$/);
        const match = m2 ?? m3;
        if (!match) continue;

        const level = m2 ? 2 : 3;
        const rawText = match[1].replace(/\*\*|__|~~|`/g, "").trim();
        let id = headingToId(rawText);

        // Deduplicate IDs
        const count = seenIds.get(id) ?? 0;
        seenIds.set(id, count + 1);
        if (count > 0) id = `${id}-${count}`;

        entries.push({ level: level as 2 | 3, text: rawText, id });
    }

    return entries;
}

// ── Pre-compute h2/h3 IDs from full content ────────────────────────────────────
// Scans the complete Markdown string (before splitting on CTA tokens) so the
// deduplication counter matches extractToc exactly, even when duplicate headings
// are separated by [[cta-contacto]] segments.
function buildHeadingIds(markdown: string): string[] {
    const ids: string[] = [];
    const seenIds = new Map<string, number>();
    for (const line of markdown.split("\n")) {
        const m = line.match(/^#{2,3} (.+)$/);
        if (!m) continue;
        const rawText = m[1].replace(/\*\*|__|~~|`/g, "").trim();
        let id = headingToId(rawText);
        const count = seenIds.get(id) ?? 0;
        seenIds.set(id, count + 1);
        if (count > 0) id = `${id}-${count}`;
        ids.push(id);
    }
    return ids;
}

// ── Custom component map ───────────────────────────────────────────────────────
// Attach stable `id` attributes to h2/h3 so ToC anchor links work.
// headingIds is the pre-computed list; cursorRef advances across all segments.
function makeComponents(
    headingIds: string[],
    cursorRef: React.MutableRefObject<number>,
) {
    const getNextId = () => {
        const id = headingIds[cursorRef.current] ?? "heading";
        cursorRef.current += 1;
        return id;
    };

    const makeHeading =
        (Tag: "h2" | "h3") =>
        ({ children, ...props }: React.ComponentPropsWithoutRef<"h2" | "h3">) => {
            const id = getNextId();

            const cls =
                Tag === "h2"
                    ? "text-2xl font-bold text-on-surface tracking-tight mt-10 mb-4 scroll-mt-24"
                    : "text-xl font-semibold text-on-surface tracking-tight mt-8 mb-3 scroll-mt-24";

            return (
                <Tag id={id} className={cls} {...props}>
                    {children}
                </Tag>
            );
        };

    return {
        h1: ({ children, ...props }: React.ComponentPropsWithoutRef<"h1">) => (
            <h1 className="text-3xl font-bold text-on-surface tracking-tight mt-10 mb-5 scroll-mt-24" {...props}>
                {children}
            </h1>
        ),
        h2: makeHeading("h2"),
        h3: makeHeading("h3"),
        h4: ({ children, ...props }: React.ComponentPropsWithoutRef<"h4">) => (
            <h4 className="text-lg font-semibold text-on-surface mt-6 mb-2 scroll-mt-24" {...props}>
                {children}
            </h4>
        ),
        p: ({ children, ...props }: React.ComponentPropsWithoutRef<"p">) => (
            <p className="text-base text-on-surface leading-relaxed mb-4" {...props}>
                {children}
            </p>
        ),
        ul: ({ children, ...props }: React.ComponentPropsWithoutRef<"ul">) => (
            <ul className="list-disc pl-6 mb-4 space-y-1.5 text-on-surface" {...props}>
                {children}
            </ul>
        ),
        ol: ({ children, ...props }: React.ComponentPropsWithoutRef<"ol">) => (
            <ol className="list-decimal pl-6 mb-4 space-y-1.5 text-on-surface" {...props}>
                {children}
            </ol>
        ),
        li: ({ children, ...props }: React.ComponentPropsWithoutRef<"li">) => (
            <li className="leading-relaxed" {...props}>
                {children}
            </li>
        ),
        blockquote: ({ children, ...props }: React.ComponentPropsWithoutRef<"blockquote">) => (
            <blockquote
                className="border-l-4 border-sbr-blue-light pl-4 py-1 my-5 text-on-surface-variant italic bg-surface-container/50 rounded-r-md"
                {...props}
            >
                {children}
            </blockquote>
        ),
        a: ({ href, children, ...props }: React.ComponentPropsWithoutRef<"a">) => {
            const isExternal = href?.startsWith("http") || href?.startsWith("//");
            return (
                <a
                    href={href}
                    className="text-sbr-blue underline underline-offset-2 hover:text-sbr-blue/70 transition-colors"
                    {...(isExternal
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    {...props}
                >
                    {children}
                </a>
            );
        },
        img: ({ src, alt, ...props }: React.ComponentPropsWithoutRef<"img">) => (
            <span className="block my-6">
                <img
                    src={src}
                    alt={alt ?? ""}
                    loading="lazy"
                    className="rounded-xl max-w-full h-auto mx-auto shadow-sm border border-outline-variant/10"
                    {...props}
                />
                {alt && (
                    <span className="block text-center text-xs text-outline mt-2 italic">
                        {alt}
                    </span>
                )}
            </span>
        ),
        code: ({ children, className, ...props }: React.ComponentPropsWithoutRef<"code">) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
                return (
                    <code
                        className={`block bg-surface-container rounded-lg px-4 py-3 text-sm font-mono text-on-surface overflow-x-auto leading-relaxed ${className ?? ""}`}
                        {...props}
                    >
                        {children}
                    </code>
                );
            }
            return (
                <code
                    className="bg-surface-container px-1.5 py-0.5 rounded text-sm font-mono text-sbr-blue"
                    {...props}
                >
                    {children}
                </code>
            );
        },
        pre: ({ children, ...props }: React.ComponentPropsWithoutRef<"pre">) => (
            <pre
                className="bg-surface-container rounded-xl my-5 overflow-x-auto border border-outline-variant/20"
                {...props}
            >
                {children}
            </pre>
        ),
        table: ({ children, ...props }: React.ComponentPropsWithoutRef<"table">) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-outline-variant/20">
                <table className="w-full text-sm text-left" {...props}>
                    {children}
                </table>
            </div>
        ),
        thead: ({ children, ...props }: React.ComponentPropsWithoutRef<"thead">) => (
            <thead className="bg-surface-container text-on-surface font-semibold" {...props}>
                {children}
            </thead>
        ),
        th: ({ children, ...props }: React.ComponentPropsWithoutRef<"th">) => (
            <th className="px-4 py-3 border-b border-outline-variant/20" {...props}>
                {children}
            </th>
        ),
        td: ({ children, ...props }: React.ComponentPropsWithoutRef<"td">) => (
            <td className="px-4 py-3 border-b border-outline-variant/10 text-on-surface-variant" {...props}>
                {children}
            </td>
        ),
        hr: (props: React.ComponentPropsWithoutRef<"hr">) => (
            <hr className="my-8 border-outline-variant/20" {...props} />
        ),
    };
}

// ── Main component ─────────────────────────────────────────────────────────────

interface BlogMarkdownProps {
    content: string;
}

export function BlogMarkdown({ content }: BlogMarkdownProps) {
    const parts = content.split(CTA_TOKEN);
    const headingIds = useMemo(() => buildHeadingIds(content), [content]);
    const cursorRef = useRef(0);
    // Reset at the start of every render so StrictMode double-renders stay in sync
    cursorRef.current = 0;
    const components = useMemo(
        () => makeComponents(headingIds, cursorRef),
        [headingIds],
    );

    return (
        <div className="blog-prose max-w-none">
            {parts.map((part, i) => (
                <span key={i}>
                    {part && (
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
                            components={components as any}
                        >
                            {part}
                        </ReactMarkdown>
                    )}
                    {/* Render CTA after every segment except the last */}
                    {i < parts.length - 1 && <BlogCta />}
                </span>
            ))}
        </div>
    );
}
