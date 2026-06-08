import { type SellingStep, type SellingPageData } from "./defaults";

type StepsSectionProps = {
    steps: SellingPageData["steps"];
};

function StepCard({ data }: { data: SellingStep }) {
    return (
        <li className="relative flex flex-col gap-4 rounded-2xl bg-white ring-1 ring-slate-200/70 shadow-sm p-7">
            <div className="flex items-center justify-between">
                <span className="text-3xl font-semibold tracking-tight text-slate-200">
                    {String(data.step).padStart(2, "0")}
                </span>
                <span className="flex items-center justify-center w-11 h-11 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                    {data.step}
                </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{data.title}</h3>
            <ul className="flex flex-col gap-1.5">
                {data.description.map((line, i) => (
                    <li key={i} className="text-sm text-slate-600 leading-relaxed">
                        {line}
                    </li>
                ))}
            </ul>
        </li>
    );
}

export function StepsSection({ steps }: StepsSectionProps) {
    return (
        <section
            id="pasos"
            className="sp-reveal bg-stone-50 text-slate-900 py-24 md:py-32 px-6"
        >
            <div className="max-w-6xl mx-auto flex flex-col gap-14">
                <div className="flex flex-col gap-4 text-center items-center max-w-2xl mx-auto">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        Proceso
                    </span>
                    <h2 className="sp-display text-3xl md:text-4xl tracking-tight text-slate-900 text-balance">
                        Adquirirlo es muy sencillo
                    </h2>
                    <p className="text-lg text-slate-600 leading-relaxed">
                        Cuatro pasos para tener tu terreno.
                    </p>
                </div>
                <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {steps.map((s, i) => (
                        <StepCard key={i} data={s} />
                    ))}
                </ol>
            </div>
        </section>
    );
}
