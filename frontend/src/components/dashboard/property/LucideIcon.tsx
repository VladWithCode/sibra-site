import { HelpCircle, type LucideProps } from "lucide-react";
import * as LucideIcons from "lucide-react";

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

export function LucideIcon({ name, ...props }: { name: string } & LucideProps) {
    const key = resolveIconName(name);
    const Component = (key ? (LucideIcons[key] as React.ComponentType<LucideProps>) : HelpCircle);
    return <Component {...props} />;
}
