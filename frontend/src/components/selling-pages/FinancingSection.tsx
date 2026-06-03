import { type SellingPageData } from "./defaults";

type FinancingSectionProps = {
    data: SellingPageData["financing"];
};

export function FinancingSection({ data }: FinancingSectionProps) {
    return (
        <section
            id="financiamiento"
            className="sp-reveal bg-sbr-nav text-white py-24 md:py-32 px-6"
        >
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center gap-12 md:gap-16">
                <div className="flex-1 flex flex-col gap-5">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                        Financiamiento
                    </span>
                    <h2 className="sp-display text-3xl md:text-4xl tracking-tight text-balance">
                        {data.heading}
                    </h2>
                    <p className="text-lg text-stone-300 leading-relaxed max-w-prose">
                        {data.body}
                    </p>
                    <a
                        href="#contacto"
                        className="mt-2 inline-flex items-center gap-2 rounded-full bg-white text-slate-900 hover:bg-stone-100 transition-colors font-semibold px-7 py-3 w-fit"
                    >
                        Solicita información
                    </a>
                </div>
                <div className="flex-1 w-full">
                    <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-lg">
                        <img
                            src={data.image}
                            alt="Financiamiento"
                            className="w-full object-cover aspect-[4/3]"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
