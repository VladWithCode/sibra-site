import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MapsAPIProvider } from "@/maps/component";
import {
    AdvancedMarker,
    Map,
    Pin,
    useMap,
    useMapsLibrary,
    type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { Loader2, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAP_ID = import.meta.env.VITE_MAPS_PROPERTY_LOCATION_ID as string | undefined;
const PICKER_MAP_ID = "selling-page-location-picker";
const DURANGO_CENTER = { lat: 24.0277, lng: -104.6532 };
const SEARCH_DEBOUNCE_MS = 400;
const MIN_QUERY_LEN = 3;

function numberFromInput(value: string): number | null {
    if (value === "") return null;
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
}

type Suggestion = {
    label: string;
    lat: number;
    lng: number;
};

/** Search input with debounced geocoder suggestions. Selecting one reports the
 * point upward (which also recenters the map). */
function GeocodeSearch({ onSelect }: { onSelect: (s: Suggestion) => void }) {
    const geocodingLib = useMapsLibrary("geocoding");
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    // Suppresses the lookup triggered by programmatically setting the input
    // text after a selection.
    const skipSearchRef = useRef(false);

    useEffect(() => {
        if (skipSearchRef.current) {
            skipSearchRef.current = false;
            return;
        }
        const trimmed = query.trim();
        if (!geocodingLib || trimmed.length < MIN_QUERY_LEN) {
            setSuggestions([]);
            setOpen(false);
            return;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const geocoder = new geocodingLib.Geocoder();
                const { results } = await geocoder.geocode({
                    address: trimmed,
                    region: "mx",
                });
                if (cancelled) return;
                setSuggestions(
                    results.slice(0, 5).map((r) => ({
                        label: r.formatted_address,
                        lat: r.geometry.location.lat(),
                        lng: r.geometry.location.lng(),
                    })),
                );
                setOpen(true);
            } catch {
                if (!cancelled) {
                    setSuggestions([]);
                    setOpen(false);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query, geocodingLib]);

    const pick = (s: Suggestion) => {
        skipSearchRef.current = true;
        setQuery(s.label);
        setSuggestions([]);
        setOpen(false);
        onSelect(s);
    };

    return (
        <div className="relative">
            <Input
                placeholder="Buscar dirección o lugar..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setOpen(true)}
                onBlur={() => setOpen(false)}
                onKeyDown={(e) => {
                    if (e.key === "Escape") setOpen(false);
                    if (e.key === "Enter") {
                        e.preventDefault();
                        if (suggestions.length > 0) pick(suggestions[0]);
                    }
                }}
            />
            {loading && (
                <Loader2 className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin" />
            )}
            {open && suggestions.length > 0 && (
                <ul className="bg-popover text-popover-foreground absolute z-10 mt-1 w-full overflow-hidden rounded-md border shadow-md">
                    {suggestions.map((s, i) => (
                        <li key={`${s.lat},${s.lng},${i}`}>
                            <button
                                type="button"
                                className="hover:bg-accent hover:text-accent-foreground flex w-full items-start gap-2 px-3 py-2 text-left text-sm"
                                // onMouseDown so the click wins over the input's blur.
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    pick(s);
                                }}
                            >
                                <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                                <span>{s.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function PickerMap({
    lat,
    lng,
    onPick,
}: {
    lat: number | null;
    lng: number | null;
    onPick: (lat: number, lng: number) => void;
}) {
    const hasPoint = typeof lat === "number" && typeof lng === "number";

    return (
        <div className="h-72 w-full overflow-hidden rounded-md border">
            <Map
                id={PICKER_MAP_ID}
                mapId={MAP_ID}
                defaultZoom={hasPoint ? 15 : 12}
                defaultCenter={hasPoint ? { lat: lat!, lng: lng! } : DURANGO_CENTER}
                fullscreenControl={false}
                mapTypeControl={false}
                streetViewControl={false}
                className="h-full w-full"
                onClick={(e: MapMouseEvent) => {
                    const pos = e.detail.latLng;
                    if (pos) onPick(pos.lat, pos.lng);
                }}
            >
                {hasPoint && (
                    <AdvancedMarker
                        position={{ lat: lat!, lng: lng! }}
                        draggable
                        onDragEnd={(e) => {
                            const pos = e.latLng;
                            if (pos) onPick(pos.lat(), pos.lng());
                        }}
                    >
                        <Pin
                            background="var(--color-sbr-green)"
                            borderColor="var(--color-sbr-green-light)"
                            glyphColor="var(--color-gray-50)"
                        />
                    </AdvancedMarker>
                )}
            </Map>
        </div>
    );
}

/** Inner body so useMap/useMapsLibrary run inside the APIProvider. */
function PickerBody({ form }: { form: any }) {
    const map = useMap(PICKER_MAP_ID);

    const setPoint = (lat: number, lng: number) => {
        form.setFieldValue("locationLat", lat);
        form.setFieldValue("locationLng", lng);
    };

    const onSelectSuggestion = (s: Suggestion) => {
        setPoint(s.lat, s.lng);
        map?.panTo({ lat: s.lat, lng: s.lng });
        map?.setZoom(15);
    };

    return (
        <div className="space-y-4">
            <GeocodeSearch onSelect={onSelectSuggestion} />

            <form.Subscribe
                selector={(s: any) => ({
                    lat: s.values.locationLat,
                    lng: s.values.locationLng,
                })}
            >
                {({ lat, lng }: { lat: number | null; lng: number | null }) => (
                    <>
                        <PickerMap lat={lat} lng={lng} onPick={setPoint} />
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="locationLat">Latitud</FieldLabel>
                                <Input
                                    id="locationLat"
                                    type="number"
                                    step="any"
                                    value={lat ?? ""}
                                    onChange={(e) =>
                                        form.setFieldValue(
                                            "locationLat",
                                            numberFromInput(e.target.value),
                                        )
                                    }
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="locationLng">Longitud</FieldLabel>
                                <Input
                                    id="locationLng"
                                    type="number"
                                    step="any"
                                    value={lng ?? ""}
                                    onChange={(e) =>
                                        form.setFieldValue(
                                            "locationLng",
                                            numberFromInput(e.target.value),
                                        )
                                    }
                                />
                            </Field>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <FieldDescription>
                                Busca una dirección, haz clic en el mapa o arrastra el pin
                                para ubicar el terreno.
                            </FieldDescription>
                            <Button
                                type="button"
                                variant="ghost"
                                disabled={lat === null && lng === null}
                                onClick={() => {
                                    form.setFieldValue("locationLat", null);
                                    form.setFieldValue("locationLng", null);
                                }}
                            >
                                <X className="size-4" /> Quitar ubicación
                            </Button>
                        </div>
                    </>
                )}
            </form.Subscribe>
        </div>
    );
}

/** Interactive map picker bound to the locationLat/locationLng form fields.
 * Click the map (or drag the pin) to set the point shown on the public page. */
export function LocationPickerField({ form }: { form: any }) {
    return (
        <MapsAPIProvider>
            <PickerBody form={form} />
        </MapsAPIProvider>
    );
}
