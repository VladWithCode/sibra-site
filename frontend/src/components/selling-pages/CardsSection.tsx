import { Card, CardContent } from "@/components/ui/card";
import { type Alignment, type SellingCard, type SellingPageData, alignText } from "./defaults";

type CardsSectionProps = {
    cards: SellingPageData["cards"];
    footnote?: string;
    alignment: Alignment;
};

function FeatureCard({ data }: { data: SellingCard }) {
    return (
        <div className="col-span-1 space-y-3 sm:space-y-6" data-card-wrapper>
            <h3
                className="text-start text-lg sm:text-2xl text-current/80 font-light opacity-0 translate-y-14"
                data-card-title
            >
                {data.title}
            </h3>
            <Card
                className="max-w-md bg-linear-to-br from-sbr-green-dark to-sbr-green-dark border-0 p-4 sm:px-6 py-10 sm:py-12 mx-auto rounded-md shadow-2xl opacity-0 translate-y-14"
                data-card
            >
                <CardContent className="flex flex-col gap-8 text-gray-50 px-2 text-start">
                    <img
                        src={data.image}
                        alt=""
                        className="w-full aspect-[4/3] object-cover object-center brightness-75 rounded"
                    />
                    <p className="sm:text-lg text-current/90 font-bold">{data.description}</p>
                </CardContent>
            </Card>
        </div>
    );
}

export function CardsSection({ cards, footnote, alignment }: CardsSectionProps) {
    return (
        <section
            id="detalles"
            className="relative z-0 grid grid-cols-1 auto-rows-auto gap-12 sm:gap-16 px-4 py-16 sm:py-24 pb-4"
        >
            {cards.map((feature) => (
                <FeatureCard key={feature.title} data={feature} />
            ))}
            {/* Footnote is the only loose copy in this section, so it follows the
                variant alignment; card titles/content stay text-start. */}
            {footnote && (
                <p className={`text-xs sm:text-sm ${alignText(alignment)}`}>{footnote}</p>
            )}
        </section>
    );
}
