import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type PlanoDialogProps = {
    image: string;
    ctaLabel: string;
    /** Classes for the trigger button (keeps original absolute positioning). */
    className?: string;
};

/**
 * "Ver plano" interaction. Always opens a shadcn Dialog lightbox of the plan
 * image. External-URL behavior was removed per client feedback — the popup is
 * the only entry point.
 */
export function PlanoDialog({ image, ctaLabel, className }: PlanoDialogProps) {
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
