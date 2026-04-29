import { cn } from '@/lib/utils';

const TONES = {
    current: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    overdue: 'bg-amber-50 text-amber-700 border-amber-100',
} as const;

export function AssociatePaymentBadge({
    pendingPayment,
    className,
}: {
    pendingPayment: boolean;
    className?: string;
}) {
    const tone = pendingPayment ? TONES.overdue : TONES.current;
    const label = pendingPayment ? 'Con Atraso' : 'Al corriente';

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-tiny font-bold uppercase tracking-wide border',
                tone,
                className,
            )}
        >
            {label}
        </span>
    );
}
