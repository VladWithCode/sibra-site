import { AdvancedMarker, Map, Pin } from "@vis.gl/react-google-maps";
import { MapPin } from "lucide-react";
import { type SellingPageData } from "./defaults";

const MAP_ID = import.meta.env.VITE_MAPS_PROPERTY_LOCATION_ID as string | undefined;

type LocationSectionProps = {
    data: SellingPageData["location"];
};

/** Renders the location map: coordinates via the Maps JS API when set,
 * otherwise the legacy embed-URL iframe. */
function LocationMap({ data }: LocationSectionProps) {
    if (typeof data.lat === "number" && typeof data.lng === "number") {
        const position = { lat: data.lat, lng: data.lng };
        return (
            <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200/70 shadow-sm min-h-64">
                <Map
                    mapId={MAP_ID}
                    defaultZoom={15}
                    defaultCenter={position}
                    fullscreenControl={false}
                    mapTypeControl={false}
                    streetViewControl={false}
                    className="w-full h-full min-h-64"
                >
                    <AdvancedMarker position={position}>
                        <Pin
                            background="var(--color-sbr-green)"
                            borderColor="var(--color-sbr-green-light)"
                            glyphColor="var(--color-gray-50)"
                        />
                    </AdvancedMarker>
                </Map>
            </div>
        );
    }
    if (data.mapEmbedUrl) {
        return (
            <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200/70 shadow-sm min-h-64">
                <iframe
                    title="Mapa de ubicación"
                    src={data.mapEmbedUrl}
                    className="w-full h-full min-h-64 border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                />
            </div>
        );
    }
    return null;
}

export function LocationSection({ data }: LocationSectionProps) {
    return (
        <section
            id="ubicacion"
            className="sp-reveal bg-white text-slate-900 py-24 md:py-32 px-6"
        >
            <div className="max-w-6xl mx-auto flex flex-col gap-12">
                <div className="flex flex-col gap-4 text-center items-center max-w-2xl mx-auto">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        Ubicación
                    </span>
                    <h2 className="sp-display text-3xl md:text-4xl tracking-tight text-slate-900 text-balance">
                        {data.heading || "En el lugar correcto"}
                    </h2>
                    {data.caption && (
                        <p className="text-lg text-slate-600 leading-relaxed">{data.caption}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200/70 shadow-sm">
                        <img
                            src={data.image}
                            alt="Ubicación"
                            className="w-full h-64 md:h-full object-cover"
                        />
                    </div>
                    <LocationMap data={data} />
                </div>

                {data.chips && data.chips.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {data.chips.map((chip, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 rounded-xl bg-stone-50 ring-1 ring-slate-200/70 px-5 py-4 text-slate-700"
                            >
                                <span className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-50 shrink-0">
                                    <MapPin className="w-4 h-4 text-emerald-700" />
                                </span>
                                <span className="text-sm font-medium leading-snug">
                                    {chip.text}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
