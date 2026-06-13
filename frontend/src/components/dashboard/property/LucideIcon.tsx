import { HelpCircle, type LucideProps } from "lucide-react";
import * as LucideIcons from "lucide-react";
import dynamicIconImports from "lucide-react/dynamicIconImports";

function toPascalCase(name: string): string {
    return name
        .trim()
        .split(/[\s_-]+/)
        .filter(Boolean)
        .map((p) => p[0].toUpperCase() + p.slice(1))
        .join("");
}

export function resolveIconName(name: string): keyof typeof LucideIcons | null {
    if (!name) return null;
    const pascal = toPascalCase(name);
    if (pascal in LucideIcons) return pascal as keyof typeof LucideIcons;
    const lower = name.toLowerCase();
    const match = Object.keys(LucideIcons).find((k) => k.toLowerCase() === lower);
    return (match as keyof typeof LucideIcons) ?? null;
}

// Canonical kebab-case icon names lucide's <DynamicIcon> (the public renderer)
// expects. This is the single source of truth for the picker.
export const ICON_NAMES: string[] = Object.keys(dynamicIconImports).sort();

// Reverse map: canonical PascalCase component name -> kebab IconName. Built from
// the dynamic-import manifest so it matches lucide exactly, including edge cases
// the naive regex gets wrong (e.g. "AArrowDown" -> "a-arrow-down").
const PASCAL_TO_KEBAB: Record<string, string> = Object.fromEntries(
    ICON_NAMES.map((kebab) => [toPascalCase(kebab), kebab]),
);

/** Normalize any icon input (PascalCase, kebab, or spaced) to the lowercase
 * kebab-case name lucide's DynamicIcon needs. Falls back to a lowercased value
 * for unknown names; returns "" for empty input. */
export function toIconName(input: string): string {
    if (!input) return "";
    const pascal = resolveIconName(input);
    if (pascal && PASCAL_TO_KEBAB[pascal]) return PASCAL_TO_KEBAB[pascal];
    return input.trim().toLowerCase();
}

export function LucideIcon({ name, ...props }: { name: string } & LucideProps) {
    const key = resolveIconName(name);
    const Component = (key ? (LucideIcons[key] as React.ComponentType<LucideProps>) : HelpCircle);
    return <Component {...props} />;
}
