import type { TUserRole } from "@/queries/type";

const ROLE_LABELS: Record<TUserRole, string> = {
    admin: "Administrador",
    editor: "Editor",
    user: "Usuario",
};

const ROLE_TONES: Record<TUserRole, string> = {
    admin: "bg-purple-100/50 text-purple-700 border-purple-300",
    editor: "bg-blue-100/50 text-blue-700 border-blue-300",
    user: "bg-slate-100/50 text-slate-600 border-slate-300",
};

export const ROLE_OPTIONS = [
    { value: "admin", label: "Administrador" },
    { value: "editor", label: "Editor" },
    { value: "user", label: "Usuario" },
] as const;

export function UserRoleBadge({ role }: { role: TUserRole }) {
    return (
        <span
            className={`${ROLE_TONES[role]} inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-wide border font-semibold`}
        >
            {ROLE_LABELS[role]}
        </span>
    );
}
