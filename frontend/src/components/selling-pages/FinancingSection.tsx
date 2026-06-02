import { type SellingPageData } from "./defaults";

type FinancingSectionProps = {
    data: SellingPageData["financing"];
};

export function FinancingSection({ data }: FinancingSectionProps) {
    return (
        <section
            id="financiamiento"
            className="relative z-0 text-center space-y-3 sm:space-y-12"
        >
            <div className="px-8 pt-16 space-y-6">
                <h2 className="sm:text-xl uppercase tracking-wide text-current/70">
                    {data.heading}
                </h2>
                <p className="text-4xl">{data.body}</p>
            </div>
            <div className="relative z-0 w-full aspect-video sm:aspect-[3/2]">
                <img
                    src={data.image}
                    alt="Imagen demostrativa del plan de financiamiento."
                    className="h-full w-full object-cover object-center brightness-75"
                />
            </div>
        </section>
    );
}
