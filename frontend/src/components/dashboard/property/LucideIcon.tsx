import { CircleHelp, type LucideProps } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import dynamicIconImports from "lucide-react/dynamicIconImports";

// Icons are resolved and rendered only through lucide's lazy dynamic-import
// manifest. Never `import * as` from "lucide-react": with the manifest in the
// graph every icon is its own chunk, so a namespace import makes the importing
// chunk statically load ~1,600 files.

// Canonical kebab-case icon names lucide's <DynamicIcon> expects. This is the
// single source of truth for the picker.
export const ICON_NAMES = Object.keys(dynamicIconImports).sort() as IconName[];

// Separator- and case-insensitive key, so "AirVent", "air-vent", "Air Vent"
// and "air_vent" all resolve to the same canonical name.
const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

const BY_NORMALIZED = new Map<string, IconName>();
for (const name of ICON_NAMES) {
    const key = normalize(name);
    if (!BY_NORMALIZED.has(key)) BY_NORMALIZED.set(key, name);
}

/** Canonical kebab-case name for any icon input (PascalCase, kebab, spaced),
 * or null when lucide has no such icon. */
export function resolveIconName(name: string): IconName | null {
    if (!name) return null;
    return BY_NORMALIZED.get(normalize(name)) ?? null;
}

/** Normalize any icon input to the lowercase kebab-case name lucide's
 * DynamicIcon needs. Falls back to a lowercased value for unknown names;
 * returns "" for empty input. */
export function toIconName(input: string): string {
    if (!input) return "";
    return resolveIconName(input) ?? input.trim().toLowerCase();
}

export function LucideIcon({ name, ...props }: { name: string } & LucideProps) {
    const resolved = resolveIconName(name);
    if (!resolved) return <CircleHelp {...props} />;
    return <DynamicIcon name={resolved} {...props} />;
}
