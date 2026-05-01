import type { TUserDetail, TPagination } from "@/queries/type";
import { UserRow } from "./UserRow";
import { UserRowCard } from "./UserRowCard";
import { UsersPaginator } from "./UsersPaginator";

export function UsersTable({
    users,
    pagination,
}: {
    users: TUserDetail[];
    pagination: TPagination;
}) {
    if (users.length === 0) {
        return (
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-10 text-center">
                <p className="text-sm font-semibold text-on-surface">Sin usuarios</p>
                <p className="text-xs text-outline mt-1">
                    No se encontraron usuarios con los filtros aplicados.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="lg:hidden flex flex-col gap-3 p-3 sm:p-4">
                {users.map((u) => (
                    <UserRowCard key={u.id} user={u} />
                ))}
            </div>

            <div className="hidden lg:block overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-surface-container-low text-left">
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">
                                Nombre
                            </th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">
                                Email
                            </th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">
                                Teléfono
                            </th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold">
                                Rol
                            </th>
                            <th className="px-6 py-4 text-tiny tracking-wider uppercase text-outline font-bold text-right">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-low">
                        {users.map((u) => (
                            <UserRow key={u.id} user={u} />
                        ))}
                    </tbody>
                </table>
            </div>

            <UsersPaginator pagination={pagination} />
        </div>
    );
}
