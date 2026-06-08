import { type Alignment, type SellingPageData } from "./defaults";
import { PlanoDialog } from "./PlanoDialog";

type AvailabilitySectionProps = {
    data: SellingPageData["availability"];
    alignment: Alignment;
};

export function AvailabilitySection({ data, alignment }: AvailabilitySectionProps) {
    const centered = alignment === "center";
    const reversed = alignment === "right";

    const rowDir = centered
        ? "md:flex-col md:items-center text-center"
        : reversed
          ? "md:flex-row-reverse md:items-center"
          : "md:flex-row md:items-center";

    const textAlign = centered ? "text-center items-center" : "text-left items-start";

    return (
        <section
            id="disponibilidad"
            className="sp-reveal bg-white text-slate-900 py-24 md:py-32 px-6"
        >
            <div className={`max-w-6xl mx-auto flex flex-col gap-12 md:gap-16 ${rowDir}`}>
                <div className="flex-1 w-full">
                    <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200/70 shadow-sm">
                        <img
                            src={data.image}
                            alt="Plano de disponibilidad"
                            className="w-full object-cover aspect-[4/3]"
                        />
                    </div>
                </div>
                <div className={`flex-1 flex flex-col gap-5 ${textAlign}`}>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        Disponibilidad
                    </span>
                    <h2 className="sp-display text-3xl md:text-4xl tracking-tight text-slate-900 text-balance">
                        Encuentra tu lote ideal
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed max-w-prose">
                        Consulta los lotes disponibles y elige el que mejor se adapte a tu
                        proyecto. Los lugares son limitados.
                    </p>
                    <PlanoDialog
                        image={data.image}
                        ctaLabel={data.ctaLabel || "Ver Plano"}
                        className="mt-1 inline-flex items-center gap-2 rounded-full border border-slate-300 hover:border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900 font-semibold px-7 py-3 transition-colors bg-transparent shadow-none w-fit"
                    />
                </div>
            </div>
        </section>
    );
}
