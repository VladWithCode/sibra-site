import type { TProperty } from "@/queries/type";
import {
    AdvancedMarker,
    APIProvider,
    ControlPosition,
    Map,
    Pin,
    type MapProps,
} from "@vis.gl/react-google-maps";
const API_KEY = import.meta.env.VITE_MAPS_API_KEY;
const PROPERTY_LOCATION_ID = import.meta.env.VITE_MAPS_PROPERTY_LOCATION_ID;

export function MapsAPIProvider({ children }: { children: React.ReactNode }) {
    // Silently fail if no API key is provided
    if (!API_KEY) {
        return <>{children}</>;
    }

    return <APIProvider apiKey={API_KEY}>{children}</APIProvider>;
}

export function PropertyLocationMap({ property, ...args }: { property: TProperty } & MapProps) {
    if (!property.lat || !property.lon) {
        return null;
    }

    return (
        <Map
            mapId={PROPERTY_LOCATION_ID}
            defaultZoom={15}
            defaultCenter={{ lat: property.lat, lng: property.lon }}
            fullscreenControl={false}
            mapTypeControl={false}
            streetViewControl={false}
            {...args}
        >
            <PropertyMapPin property={property} />
        </Map>
    );
}

function PropertyMapPin({ property }: { property: TProperty }) {
    return (
        <AdvancedMarker
            key={`${property.id}-pin`}
            position={{ lat: property.lat, lng: property.lon }}
        >
            <Pin
                background={"var(--color-sbr-green)"}
                borderColor={"var(--color-sbr-green-light)"}
                glyphColor={"var(--color-gray-50)"}
            />
        </AdvancedMarker>
    );
}
