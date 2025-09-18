import { getProperties } from "@/properties/queries";
import { queryOptions } from "@tanstack/react-query";

export const PropertyQueryKeys = {
    all: () => ["properties"],
    byId: (id: string) => ["properties", id],
    nearby: (id: string, nearbyDistance: number) => ["properties", id, "nearby", nearbyDistance],
    nearbyByCoords: (id: string, nearbyDistance: number, coords: string) => ["properties", id, "nearby", nearbyDistance, coords],
};

export const getPropertyOpts = queryOptions({
    queryKey: PropertyQueryKeys.all(),
    queryFn: getProperties,
});
