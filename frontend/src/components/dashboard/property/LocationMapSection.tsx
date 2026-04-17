import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MapsAPIProvider } from "@/maps/component";
import {
    AdvancedMarker,
    Map,
    Pin,
    useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { MapPin, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PROPERTY_LOCATION_ID = import.meta.env.VITE_MAPS_PROPERTY_LOCATION_ID as
    | string
    | undefined;

type ErrorList = Array<{ message?: string } | undefined>;
function errsOf(field: { state: { meta: { errors: unknown } } }) {
    return field.state.meta.errors as unknown as ErrorList;
}
function numberFromInput(value: string): number | undefined {
    if (value === "") return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
}

function buildAddress(form: any): string {
    const s = form.state.values;
    return [s.address, s.nbHood, s.city, s.state, s.zip, s.country]
        .filter((v) => v && String(v).trim() !== "")
        .join(", ");
}

function GeocodeButton({ form }: { form: any }) {
    const geocodingLib = useMapsLibrary("geocoding");
    const [loading, setLoading] = useState(false);

    const onGeocode = async () => {
        if (!geocodingLib) {
            toast.error("El servicio de mapas no está disponible", { closeButton: true });
            return;
        }
        const address = buildAddress(form);
        if (!address) {
            toast.error("Ingresa una dirección antes de geocodificar", { closeButton: true });
            return;
        }
        setLoading(true);
        try {
            const geocoder = new geocodingLib.Geocoder();
            const { results } = await geocoder.geocode({ address });
            if (!results.length) {
                toast.error("No se encontraron coordenadas para la dirección");
                return;
            }
            const loc = results[0].geometry.location;
            form.setFieldValue("lat", loc.lat());
            form.setFieldValue("lon", loc.lng());
            toast.success("Coordenadas actualizadas desde la dirección", {
                closeButton: true,
            });
        } catch (e: any) {
            toast.error(e?.message || "Error al geocodificar la dirección", {
                closeButton: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button type="button" variant="outline" onClick={onGeocode} disabled={loading}>
            <Search className="size-4" />
            {loading ? "Buscando..." : "Geocodificar dirección"}
        </Button>
    );
}

function LocationMap({ lat, lon }: { lat: number; lon: number }) {
    return (
        <div className="h-64 w-full overflow-hidden rounded-md border">
            <Map
                key={`${lat},${lon}`}
                mapId={PROPERTY_LOCATION_ID}
                defaultZoom={15}
                defaultCenter={{ lat, lng: lon }}
                fullscreenControl={false}
                mapTypeControl={false}
                streetViewControl={false}
                className="h-full w-full"
            >
                <AdvancedMarker position={{ lat, lng: lon }}>
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

export function LocationMapSection({ form }: { form: any }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <MapPin className="size-5" />
                    Ubicación
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                <MapsAPIProvider>
                    <form.Subscribe
                        selector={(s: any) => ({
                            lat: s.values.lat,
                            lon: s.values.lon,
                        })}
                    >
                        {({ lat, lon }: { lat: number | undefined; lon: number | undefined }) =>
                            typeof lat === "number" && typeof lon === "number" ? (
                                <LocationMap lat={lat} lon={lon} />
                            ) : (
                                <div className="bg-muted/40 flex h-64 w-full items-center justify-center rounded-md border border-dashed">
                                    <p className="text-muted-foreground text-sm">
                                        Ingresa la dirección y geocodifica para ver el mapa
                                    </p>
                                </div>
                            )
                        }
                    </form.Subscribe>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <form.Field name="lat">
                            {(field: any) => (
                                <Field>
                                    <FieldLabel htmlFor="lat">Latitud</FieldLabel>
                                    <Input
                                        id="lat"
                                        type="number"
                                        step="any"
                                        value={field.state.value === undefined ? "" : field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) =>
                                            field.handleChange(numberFromInput(e.target.value))
                                        }
                                    />
                                    <FieldError errors={errsOf(field)} />
                                </Field>
                            )}
                        </form.Field>
                        <form.Field name="lon">
                            {(field: any) => (
                                <Field>
                                    <FieldLabel htmlFor="lon">Longitud</FieldLabel>
                                    <Input
                                        id="lon"
                                        type="number"
                                        step="any"
                                        value={field.state.value === undefined ? "" : field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) =>
                                            field.handleChange(numberFromInput(e.target.value))
                                        }
                                    />
                                    <FieldError errors={errsOf(field)} />
                                </Field>
                            )}
                        </form.Field>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <FieldDescription>
                            Usa la geocodificación para ubicar la propiedad a partir de la dirección,
                            o introduce las coordenadas manualmente.
                        </FieldDescription>
                        <GeocodeButton form={form} />
                    </div>
                </MapsAPIProvider>
            </CardContent>
        </Card>
    );
}
