import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

// The elements a description may contain. Anything else (images, code, raw
// HTML) is dropped by the sanitizer; unknown wrappers keep their text.
const sanitizeSchema = {
    ...defaultSchema,
    tagNames: [
        "p",
        "br",
        "strong",
        "em",
        "del",
        "a",
        "ul",
        "ol",
        "li",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
    ],
};

// Descriptions written before Markdown support indent lines with tabs or
// spaces. Without this, Markdown would turn those lines into code blocks.
function remarkNoIndentedCode(this: { data(): object }) {
    const data = this.data() as { micromarkExtensions?: unknown[] };
    (data.micromarkExtensions ??= []).push({ disable: { null: ["codeIndented"] } });
}

const remarkPlugins = [remarkGfm, remarkBreaks, remarkNoIndentedCode];
const rehypePlugins = [[rehypeSanitize, sanitizeSchema]] as ComponentPropsWithoutRef<
    typeof ReactMarkdown
>["rehypePlugins"];

// The page owns h1/h2, so headings start at h3 whatever level the author typed.
function Heading({ children }: ComponentPropsWithoutRef<"h3">) {
    return (
        <h3 className="mt-6 mb-2 text-lg font-bold text-on-surface first:mt-0">{children}</h3>
    );
}

function SubHeading({ children }: ComponentPropsWithoutRef<"h4">) {
    return (
        <h4 className="mt-5 mb-2 text-base font-semibold text-on-surface first:mt-0">
            {children}
        </h4>
    );
}

const components: Components = {
    h1: Heading,
    h2: Heading,
    h3: Heading,
    h4: SubHeading,
    h5: SubHeading,
    h6: SubHeading,
    p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
    strong: ({ children }) => (
        <strong className="font-semibold text-on-surface">{children}</strong>
    ),
    ul: ({ children }) => (
        <ul className="mb-4 list-disc space-y-1 pl-6 last:mb-0">{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-4 list-decimal space-y-1 pl-6 last:mb-0">{children}</ol>
    ),
    a: ({ href, children }) => {
        const external = /^(https?:)?\/\//.test(href ?? "");
        return (
            <a
                href={href}
                className="text-sbr-blue underline underline-offset-2 transition-colors hover:text-sbr-blue/70"
                {...(external ? { target: "_blank", rel: "nofollow noopener" } : {})}
            >
                {children}
            </a>
        );
    },
    table: ({ children }) => (
        <div className="mb-4 overflow-x-auto rounded-lg border border-outline-variant/30 last:mb-0">
            <table className="w-full text-left text-sm">{children}</table>
        </div>
    ),
    thead: ({ children }) => (
        <thead className="bg-surface-container font-semibold text-on-surface">{children}</thead>
    ),
    th: ({ children, style }) => (
        <th className="border-b border-outline-variant/30 px-3 py-2" style={style}>
            {children}
        </th>
    ),
    td: ({ children, style }) => (
        <td className="border-b border-outline-variant/15 px-3 py-2" style={style}>
            {children}
        </td>
    ),
};

/** Renders a property description written in Markdown (see sanitizeSchema). */
export function PropertyMarkdown({
    content,
    className,
}: {
    content: string;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "font-sans leading-relaxed break-words text-on-surface-variant [&_tr:last-child>td]:border-b-0",
                className,
            )}
        >
            <ReactMarkdown
                remarkPlugins={remarkPlugins}
                rehypePlugins={rehypePlugins}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
