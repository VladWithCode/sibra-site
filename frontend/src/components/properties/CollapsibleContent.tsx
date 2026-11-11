import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

// About 12 lines of body text.
const COLLAPSED_HEIGHT = 320;

/**
 * Clamps tall content to COLLAPSED_HEIGHT behind a "Ver más" toggle. Content
 * that already fits is rendered as-is. The full content stays in the DOM.
 */
export function CollapsibleContent({ children }: { children: ReactNode }) {
    const id = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [fullHeight, setFullHeight] = useState(0);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const observer = new ResizeObserver(() => setFullHeight(el.scrollHeight));
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // A few pixels of slack: hiding one extra line behind a button helps nobody.
    const collapsible = fullHeight > COLLAPSED_HEIGHT + 48;

    const toggle = () => {
        setExpanded((v) => !v);
        // When collapsing, keep the section in view instead of far below it.
        if (expanded) rootRef.current?.scrollIntoView({ block: "nearest" });
    };

    return (
        <div ref={rootRef} className="scroll-mt-24">
            <div
                id={id}
                className="relative overflow-hidden motion-safe:transition-[max-height] motion-safe:duration-300"
                style={
                    collapsible
                        ? { maxHeight: expanded ? fullHeight : COLLAPSED_HEIGHT }
                        : undefined
                }
            >
                <div ref={contentRef}>{children}</div>
                {collapsible && !expanded && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-surface-container-lowest to-transparent" />
                )}
            </div>
            {collapsible && (
                <button
                    type="button"
                    onClick={toggle}
                    aria-expanded={expanded}
                    aria-controls={id}
                    className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-sbr-blue hover:text-sbr-blue/70"
                >
                    {expanded ? "Ver menos" : "Ver más"}
                    <ChevronDown
                        className={`size-4 motion-safe:transition-transform ${expanded ? "rotate-180" : ""}`}
                    />
                </button>
            )}
        </div>
    );
}
