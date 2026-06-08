import { CheckCircle2 } from "lucide-react";
import { type FinePrintSegment, type SellingPageData } from "./defaults";

type OfferSectionProps = {
    data: SellingPageData["offer"];
};

function renderFinePrint(segs: FinePrintSegment[]) {
    return segs.map((s, i) =>
        s.strong ? (
            <strong key={i} className="font-semibold text-slate-700">
                {s.text}
            </strong>
        ) : (
            <span key={i}>{s.text}</span>
        ),
    );
}

export function OfferSection({ data }: OfferSectionProps) {
    return (
        <section id="oferta" className="sp-reveal bg-white text-slate-900 py-24 md:py-32 px-6">
            <div className="max-w-6xl mx-auto flex flex-col gap-12">
                <div className="flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        La oferta
                    </span>
                    <h2 className="sp-display text-3xl md:text-4xl tracking-tight text-slate-900 text-balance">
                        Una inversión a tu medida
                    </h2>
                </div>
                <div className="flex flex-col md:flex-row gap-8 md:items-stretch">
                    <div className="flex-1">
                        <div className="h-full overflow-hidden rounded-2xl ring-1 ring-slate-200/70 shadow-sm">
                            <img
                                src={data.landImage}
                                alt="Terreno"
                                className="w-full h-full object-cover min-h-72"
                            />
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col gap-7 rounded-2xl bg-stone-50 ring-1 ring-slate-200/70 p-8 lg:p-10">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-slate-500 uppercase tracking-wider">
                                {data.badge || "Desde"}
                            </span>
                            <div className="flex items-end gap-2">
                                <span className="sp-display text-5xl lg:text-6xl tracking-tight text-slate-900">
                                    {data.price}
                                </span>
                                {data.period && (
                                    <span className="text-base font-medium text-slate-500 mb-2">
                                        / {data.period}
                                    </span>
                                )}
                            </div>
                            {data.dimensionsValue && (
                                <p className="mt-1 text-slate-600">
                                    {data.dimensionsLabel || "Dimensiones"}:{" "}
                                    <span className="font-semibold text-slate-900">
                                        {data.dimensionsValue}
                                    </span>
                                </p>
                            )}
                        </div>
                        <div className="h-px bg-slate-200" />
                        <ul className="flex flex-col gap-3">
                            {data.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <span>{f}</span>
                                </li>
                            ))}
                        </ul>
                        <a
                            href="#contacto"
                            className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-500 transition-colors text-white font-semibold py-3.5"
                        >
                            Aparta tu lote
                        </a>
                        {data.finePrint && data.finePrint.length > 0 && (
                            <p className="text-xs text-slate-500 leading-relaxed">
                                {renderFinePrint(data.finePrint)}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
