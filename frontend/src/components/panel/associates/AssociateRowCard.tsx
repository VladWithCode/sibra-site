import type { TProjectAssociate } from '@/queries/type';
import { Link, useNavigate } from '@tanstack/react-router';
import { Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AssociateDeleteDialog } from './AssociateDeleteDialog';
import { AssociatePaymentBadge } from './AssociatePaymentBadge';

export function AssociateRowCard({
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

    const onCardClick = () => navigate(detailHref);
    const onCardKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            navigate(detailHref);
        }
    };
    const stop = (e: React.MouseEvent | React.KeyboardEvent) =>
        e.stopPropagation();

    return (
        <div
            role="link"
            tabIndex={0}
            aria-label={`Ver detalle de ${associate.name}`}
            onClick={onCardClick}
            onKeyDown={onCardKey}
            className="group cursor-pointer bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 flex flex-col gap-2 hover:shadow-md hover:border-sbr-blue/30 transition-all"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <Link
                        {...detailHref}
                        onClick={stop}
                        className="text-sm font-bold text-on-surface line-clamp-1 hover:text-sbr-blue"
                    >
                        {associate.name}
                    </Link>
                    <p className="text-xs text-outline">{associate.phone}</p>
                </div>
                <AssociatePaymentBadge
                    pendingPayment={associate.pendingPayment}
                />
            </div>
            <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                <span>{associate.rfc || associate.curp || '—'}</span>
                {associate.lotNum && (
                    <span>
                        Lote {associate.lotNum}
                        {associate.appleNum && ` · Mz. ${associate.appleNum}`}
                    </span>
                )}
            </div>
            <div className="flex items-center justify-end gap-1 pt-1">
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
        </div>
    );
}
