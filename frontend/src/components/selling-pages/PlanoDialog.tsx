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
            <DialogContent
                className="w-screen h-[100dvh] max-w-none sm:w-[95vw] sm:h-[90vh] sm:max-w-[95vw] p-1 sm:p-2 bg-background sm:rounded-lg gap-0"
                showCloseButton
            >
                <DialogTitle className="sr-only">Plano de disponibilidad</DialogTitle>
                {/* object-contain so the plan is never cropped; container scrolls/pans
                    when the image is larger than the viewport. */}
                <div className="h-full w-full overflow-auto">
                    <img
                        src={image}
                        alt="Plano de disponibilidad del desarrollo"
                        className="mx-auto h-full w-auto max-w-none object-contain"
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
