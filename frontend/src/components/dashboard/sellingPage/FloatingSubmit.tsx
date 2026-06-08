import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Floating bottom-right submit control that follows scroll. Hidden while the
 * inline submit button (referenced by `anchorRef`) is on screen. Submits the
 * same form via the native `form` attribute — no duplicated submit logic.
 */
export function FloatingSubmit({
    formId,
    label,
    anchorRef,
    disabled,
}: {
    formId: string;
    label: string;
    anchorRef: React.RefObject<HTMLElement | null>;
    disabled?: boolean;
}) {
    const [showFloating, setShowFloating] = useState(true);
    const ioRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        const el = anchorRef.current;
        if (!el || !("IntersectionObserver" in window)) return;
        ioRef.current = new IntersectionObserver(
            (entries) => setShowFloating(!entries[0].isIntersecting),
            { threshold: 0 },
        );
        ioRef.current.observe(el);
        return () => ioRef.current?.disconnect();
    }, [anchorRef]);

    if (!showFloating) return null;

    return (
        <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
            <Button
                type="submit"
                form={formId}
                size="lg"
                disabled={disabled}
                className="shadow-lg"
            >
                <Save className="size-4" /> {label}
            </Button>
        </div>
    );
}
