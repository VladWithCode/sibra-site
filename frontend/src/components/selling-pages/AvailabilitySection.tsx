import { type Alignment, type SellingPageData } from "./defaults";
import { PlanoDialog } from "./PlanoDialog";

type AvailabilitySectionProps = {
    data: SellingPageData["availability"];
    alignment: Alignment;
};

/** Horizontal placement of the "Ver Plano" button, mirroring the variant side. */
function ctaPosition(alignment: Alignment): string {
    switch (alignment) {
        case "left":
            return "left-4";
        case "center":
            return "left-1/2 -translate-x-1/2";
        default:
            return "right-4";
    }
}

export function AvailabilitySection({ data, alignment }: AvailabilitySectionProps) {
    return (
        <section id="disponibilidad" className="pt-36 pb-20 px-4 lg:px-12 space-y-6">
            <div className="relative z-0">
                <img
                    src={data.image}
                    alt="Imagen del plano de disponibilidad del desarrollo"
                    className="h-full w-full object-cover object-center rounded shadow-lg opacity-0"
                    data-avl-img
                />
                <div className="translate-y-14 opacity-0" data-avl-content>
                    <PlanoDialog
                        image={data.image}
                        ctaLabel={data.ctaLabel}
                        className={`absolute -bottom-3 ${ctaPosition(alignment)} px-8 sm:py-5 text-lg sm:text-xl text-primary-foreground font-medium bg-linear-to-b from-sbr-green-light to-sbr-green rounded shadow-lg`}
                    />
                </div>
            </div>
        </section>
    );
}
