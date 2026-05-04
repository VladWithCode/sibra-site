import { getPropertyFilteredListingOpts } from "@/queries/properties";
import type { TProperty, TPropertyFilters, TPropertyType } from "@/queries/type";
import { MapsAPIProvider } from "@/maps/component";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
    AdvancedMarker,
    Map,
    useMap,
} from "@vis.gl/react-google-maps";
import {
    MarkerClusterer,
    type Marker,
    type Renderer,
} from "@googlemaps/markerclusterer";
import { Bath, Bed, Building2, Home, Ruler, Trees, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoadingCircles } from "../icons/loadingCircles";
import { PropertyImage } from "../Image";
import { getPropertyAddress } from "@/lib/utils";
import { FormatMetric, FormatMoney } from "@/lib/format";

const PROPERTY_LOCATION_ID = import.meta.env.VITE_MAPS_PROPERTY_LOCATION_ID;

const DURANGO_CENTER = { lat: 24.0277, lng: -104.6532 };
const DEFAULT_ZOOM = 12;

type PropertyWithCoords = TProperty & { lat: number; lon: number };

export function PropertyListingMap({
    filters,
}: {
    filters: Partial<TPropertyFilters>;
}) {
    const { data } = useSuspenseQuery(
        getPropertyFilteredListingOpts(filters),
    );

    const properties = useMemo(
        () =>
            (data.properties ?? []).filter(
                (p): p is PropertyWithCoords => !!p.lat && !!p.lon,
            ),
        [data.properties],
    );

    return (
        <MapsAPIProvider>
            <div className="relative w-full h-[calc(100svh-var(--header-height,64px))] bg-surface-container">
                <Map
                    mapId={PROPERTY_LOCATION_ID}
                    defaultCenter={DURANGO_CENTER}
                    defaultZoom={DEFAULT_ZOOM}
                    gestureHandling="greedy"
                    fullscreenControl={false}
                    mapTypeControl={false}
                    streetViewControl={false}
                >
                    <MapContents properties={properties} />
                </Map>
                {properties.length === 0 && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-surface-container-highest border border-outline-variant text-on-surface text-sm rounded-full px-4 py-2 shadow-md pointer-events-none">
                        No se encontraron propiedades para la búsqueda ingresada.
                    </div>
                )}
            </div>
        </MapsAPIProvider>
    );
}

function MapContents({
    properties,
}: {
    properties: PropertyWithCoords[];
}) {
    const map = useMap();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const markersRef = useRef<Record<string, Marker>>({});
    const clustererRef = useRef<MarkerClusterer | null>(null);

    useEffect(() => {
        if (!map) return;
        if (!("geolocation" in navigator)) return;
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                map.panTo({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
            },
            () => { },
            { enableHighAccuracy: false, timeout: 5000 },
        );
    }, [map]);

    useEffect(() => {
        if (!map) return;
        clustererRef.current = new MarkerClusterer({
            map,
            renderer: clusterRenderer,
        });
        return () => {
            clustererRef.current?.clearMarkers();
            clustererRef.current = null;
        };
    }, [map]);

    const setMarkerRef = useCallback((marker: Marker | null, id: string) => {
        const clusterer = clustererRef.current;
        const existing = markersRef.current[id];
        if (marker === existing) return;

        if (existing) {
            clusterer?.removeMarker(existing);
            delete markersRef.current[id];
        }
        if (marker) {
            markersRef.current[id] = marker;
            clusterer?.addMarker(marker);
        }
    }, []);

    useEffect(() => {
        const clusterer = clustererRef.current;
        if (!clusterer) return;
        const ids = new Set(properties.map((p) => p.id));
        for (const [id, marker] of Object.entries(markersRef.current)) {
            if (!ids.has(id)) {
                clusterer.removeMarker(marker);
                delete markersRef.current[id];
            }
        }
        if (selectedId && !ids.has(selectedId)) setSelectedId(null);
    }, [properties, selectedId]);

    const selected = selectedId
        ? properties.find((p) => p.id === selectedId)
        : null;

    const handlePinClick = (prop: PropertyWithCoords) => {
        setSelectedId(prop.id);
        if (map) {
            map.panTo({ lat: prop.lat, lng: prop.lon });
            const z = map.getZoom() ?? DEFAULT_ZOOM;
            if (z < 15) map.setZoom(15);
        }
    };

    return (
        <>
            {properties.map((prop) => (
                <AdvancedMarker
                    key={prop.id}
                    ref={(m) => setMarkerRef(m, prop.id)}
                    position={{ lat: prop.lat, lng: prop.lon }}
                    onClick={() => handlePinClick(prop)}
                    zIndex={selectedId === prop.id ? 1000 : undefined}
                >
                    <PropertyPin type={prop.propertyType} />
                </AdvancedMarker>
            ))}
            {selected && (
                <AdvancedMarker
                    key={`${selected.id}-popup`}
                    position={{ lat: selected.lat, lng: selected.lon }}
                    zIndex={2000}
                >
                    <PropertyPopup
                        property={selected}
                        onClose={() => setSelectedId(null)}
                    />
                </AdvancedMarker>
            )}
        </>
    );
}

function PropertyPin({ type }: { type: TPropertyType }) {
    const Icon = propTypeIcon(type);
    return (
        <div className="relative flex flex-col items-center">
            <div className="bg-sbr-blue text-white rounded-lg p-1.5 border-2 border-white shadow-md">
                <Icon className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-sbr-blue -mt-px" />
        </div>
    );
}

function PropertyPopup({
    property,
    onClose,
}: {
    property: PropertyWithCoords;
    onClose: () => void;
}) {
    return (
        <div className="relative mb-10 -translate-y-2">
            <div className="w-72 bg-card text-card-foreground rounded-xl shadow-xl border border-outline-variant overflow-hidden">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="absolute top-2 right-2 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
                <Link
                    to="/propiedades/$contract/$slug"
                    params={{ contract: property.contract, slug: property.slug }}
                    className="block"
                >
                    {property.mainImg ? (
                        <PropertyImage
                            propId={property.id}
                            propName={property.address}
                            src={property.mainImg}
                            className="w-full h-32 object-cover"
                        />
                    ) : (
                        <div className="w-full h-32 bg-surface-container-highest" />
                    )}
                </Link>
                <div className="p-3 space-y-1.5">
                    <Link
                        to="/propiedades/$contract/$slug"
                        params={{ contract: property.contract, slug: property.slug }}
                        className="block text-sm font-semibold text-on-surface hover:text-sbr-blue line-clamp-2 sm:line-clamp-1"
                    >
                        {getPropertyAddress(property)}
                    </Link>
                    <p className="text-xl font-extrabold text-sbr-blue leading-tight">
                        {FormatMoney(property.price)}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant pt-1">
                        <span className="flex items-center gap-1">
                            <Bed className="w-3.5 h-3.5" />
                            {property.beds}
                        </span>
                        <span className="flex items-center gap-1">
                            <Bath className="w-3.5 h-3.5" />
                            {property.baths}
                        </span>
                        <span className="flex items-center gap-1">
                            <Ruler className="w-3.5 h-3.5" />
                            <span>{FormatMetric(property.sqMt)}<sup>2</sup></span>
                        </span>
                    </div>
                </div>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white" />
        </div>
    );
}

function propTypeIcon(type: TPropertyType) {
    switch (type) {
        case "apartamento":
            return Building2;
        case "terreno":
            return Trees;
        case "casa":
        default:
            return Home;
    }
}

const clusterRenderer: Renderer = {
    render: ({ count, position }) => {
        const div = document.createElement("div");
        div.className =
            "flex items-center justify-center w-10 h-10 rounded-full bg-sbr-blue text-white text-sm font-bold border-2 border-white shadow-lg";
        div.textContent = String(count);
        return new google.maps.marker.AdvancedMarkerElement({
            position,
            content: div,
        });
    },
};

export function PropertyListingMapLoading() {
    return (
        <div className="flex flex-col items-center justify-center w-full h-[calc(100svh-var(--header-height,64px))] bg-surface-container">
            <LoadingCircles className="text-primary-container" />
        </div>
    );
}
