import type { TProjectAssociate } from '@/queries/type';
import { Link, useNavigate } from '@tanstack/react-router';
import { Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AssociateDeleteDialog } from './AssociateDeleteDialog';
import { AssociatePaymentBadge } from './AssociatePaymentBadge';

export function AssociateRow({
    associate,
    projectId,
}: {
    associate: TProjectAssociate;
    projectId: string;
}) {
    const navigate = useNavigate();
    const [deleteOpen, setDeleteOpen] = useState(false);

    const detailHref = {
        to: '/panel/proyectos/$id/asociados/$associateId',
        params: { id: projectId, associateId: associate.id },
    } as const;

    const onRowClick = () => navigate(detailHref);
    const onRowKey = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            navigate(detailHref);
        }
    };
    const stop = (e: React.MouseEvent | React.KeyboardEvent) =>
        e.stopPropagation();

    return (
        <tr
            className="group cursor-pointer hover:bg-surface-bright transition-colors duration-300"
            onClick={onRowClick}
            onKeyDown={onRowKey}
            tabIndex={0}
            role="link"
            aria-label={`Ver detalle de ${associate.name}`}
        >
            <td className="px-6 py-5">
                <div className="min-w-0">
                    <Link
                        {...detailHref}
                        onClick={stop}
                        className="text-sm font-bold text-on-surface line-clamp-1 hover:text-sbr-blue"
                    >
                        {associate.name}
                    </Link>
                    <p className="text-xs text-outline line-clamp-1">
                        {associate.phone}
                    </p>
                </div>
            </td>
            <td className="px-6 py-5">
                <p className="text-sm text-on-surface-variant line-clamp-1">
                    {associate.rfc || '—'}
                </p>
                {associate.curp && (
                    <p className="text-xs text-outline line-clamp-1">
                        {associate.curp}
                    </p>
                )}
            </td>
            <td className="px-6 py-5">
                <p className="text-sm text-on-surface">
                    {associate.lotNum || '—'}
                </p>
                {associate.appleNum && (
                    <p className="text-xs text-outline">
                        Mz. {associate.appleNum}
                    </p>
                )}
            </td>
            <td className="px-6 py-5">
                <AssociatePaymentBadge
                    pendingPayment={associate.pendingPayment}
                />
            </td>
            <td className="px-6 py-5 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                    <Link
                        {...detailHref}
                        onClick={stop}
                        aria-label="Editar asociado"
                        className="p-2 text-slate-400 hover:text-sbr-blue hover:bg-sbr-blue/5 rounded-lg transition-all"
                    >
                        <Edit2 className="size-4" />
                    </Link>
                    <button
                        type="button"
                        onClick={(e) => {
                            stop(e);
                            setDeleteOpen(true);
                        }}
                        aria-label="Eliminar asociado"
                        className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/5 rounded-lg transition-all"
                    >
                        <Trash2 className="size-4" />
                    </button>
                </div>
                <AssociateDeleteDialog
                    associateId={associate.id}
                    associateLabel={associate.name}
                    open={deleteOpen}
                    onOpenChange={setDeleteOpen}
                />
            </td>
        </tr>
    );
}
