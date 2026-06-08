import { type Alignment, type SellingCard, type SellingPageData } from "./defaults";

type CardsSectionProps = {
    cards: SellingPageData["cards"];
    footnote?: string;
    alignment: Alignment;
};

function FeatureCard({ data }: { data: SellingCard }) {
    return (
        <article className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200/70 shadow-sm hover:shadow-md transition-shadow">
            <div className="overflow-hidden">
                <img
                    src={data.image}
                    alt={data.title}
                    className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            </div>
            <div className="p-6 flex flex-col gap-2">
                <h3 className="text-lg font-semibold text-slate-900">{data.title}</h3>
                <p className="text-slate-600 leading-relaxed">{data.description}</p>
            </div>
        </article>
    );
}

export function CardsSection({ cards, footnote, alignment }: CardsSectionProps) {
    const centered = alignment === "center";
    const intro = centered
        ? "items-center text-center mx-auto"
        : alignment === "right"
          ? "items-end text-right ml-auto"
          : "items-start text-left";

    return (
        <section
            id="detalles"
            className="sp-reveal bg-stone-50 text-slate-900 py-24 md:py-32 px-6"
        >
            <div className="max-w-6xl mx-auto flex flex-col gap-14">
                <div className={`flex flex-col gap-4 max-w-2xl ${intro}`}>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        Por qué aquí
                    </span>
                    <h2 className="sp-display text-3xl md:text-4xl tracking-tight text-slate-900 text-balance">
                        Todo lo que tu patrimonio merece
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        Construye con tranquilidad sobre bases sólidas.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {cards.map((c) => (
                        <FeatureCard key={c.title} data={c} />
                    ))}
                </div>
                {footnote && (
                    <p className="text-sm text-slate-500 text-center max-w-3xl mx-auto">
                        {footnote}
                    </p>
                )}
            </div>
        </section>
    );
}
