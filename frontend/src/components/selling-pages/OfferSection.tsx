import { CheckCircle2 } from "lucide-react";
import { type SellingPageData } from "./defaults";

type OfferSectionProps = {
    data: SellingPageData["offer"];
};

export function OfferSection({ data }: OfferSectionProps) {
    return (
        <section
            id="oferta"
            className="relative z-0 flex flex-col items-center justify-center bg-secondary pb-12 space-y-8"
        >
            <div
                className="relative z-10 w-4/5 max-w-md -translate-y-8 translate-x-4 sm:translate-x-24 bg-linear-to-b from-sbr-blue to-sbr-blue-dark p-4 sm:p-8 pt-24 sm:pt-32 rounded shadow space-y-4 opacity-0"
                data-container
            >
                <div
                    className="absolute top-6 -left-4 p-1 pl-8 sm:p-2 sm:pl-8 bg-card rounded shadow-lg -translate-x-6 opacity-0"
                    data-badge
                >
                    <h2 className="text-lg sm:text-2xl font-bold text-gray-800 uppercase">
                        {data.badge}
                    </h2>
                </div>
                <p className="text-5xl sm:text-6xl font-bold scale-0" data-oferta-price>
                    {data.price}
                    <span className="text-2xl font-normal tracking-wide ml-1.5">
                        {data.period}
                    </span>
                </p>
                <ul className="px-4 sm:py-4 sm:space-y-1">
                    {data.features.map((feature, index) => (
                        <li
                            key={index}
                            className="flex items-center gap-2 -translate-x-6 opacity-0"
                            data-feat-item
                        >
                            <CheckCircle2 className="size-8 stroke-sbr-blue-light fill-current" />
                            <span className="text-sm sm:text-base">{feature}</span>
                        </li>
                    ))}
                </ul>
                <div className="relative z-0 px-2">
                    <div className="relative z-10 w-fit px-2.5 sm:px-3.5 py-1 sm:py-2 bg-linear-to-b from-sbr-green-dark to-sbr-green rounded-xs space-y-1">
                        <p className="text-lg sm:text-xl">{data.dimensionsLabel}</p>
                        <p className="text-xl sm:text-2xl font-bold">{data.dimensionsValue}</p>
                    </div>
                    <div className="absolute z-0 flex justify-end bottom-0 right-0">
                        <img
                            className="w-56 sm:w-80 aspect-[3/1] translate-y-12 sm:translate-y-20 translate-x-10 sm:translate-x-18 scale-0"
                            src={data.landImage}
                            alt="Imagen representativa de la fracción de terreno."
                            width="300"
                            height="100"
                            data-feat-land
                        />
                    </div>
                </div>
            </div>
            <p className="w-full text-xs sm:text-sm text-gray-800 text-end px-4 sm:px-8">
                {data.finePrint.map((seg, index) =>
                    seg.strong ? (
                        <strong key={index}>{seg.text}</strong>
                    ) : (
                        <span key={index}>{seg.text}</span>
                    ),
                )}
            </p>
        </section>
    );
}
