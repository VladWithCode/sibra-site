import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type PlanoDialogProps = {
    image: string;
    ctaLabel: string;
    /** When set (external URL), the CTA opens the link instead of a lightbox. */
    planHref?: string;
    /** Classes for the trigger button (keeps original absolute positioning). */
    className?: string;
};

/**
 * "Ver plano" interaction. If `planHref` is an external URL the button opens it
 * in a new tab; otherwise it opens a shadcn Dialog lightbox of the plan image.
 */
export function PlanoDialog({ image, ctaLabel, planHref, className }: PlanoDialogProps) {
    if (planHref) {
        return (
            <Button asChild size="sm" className={className}>
                <a href={planHref} target="_blank" rel="noopener noreferrer">
                    {ctaLabel}
                </a>
            </Button>
        );
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" className={className}>
                    {ctaLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl w-[95vw] p-2 sm:p-3 bg-background">
                <DialogTitle className="sr-only">Plano de disponibilidad</DialogTitle>
                <img
                    src={image}
                    alt="Plano de disponibilidad del desarrollo"
                    className="w-full h-auto max-h-[85vh] object-contain rounded"
                />
            </DialogContent>
        </Dialog>
    );
}
