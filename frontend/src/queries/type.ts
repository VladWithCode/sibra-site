export type TProperty = {
    id: string;
    address: string;
    description: string;
    city: string;
    state: string;
    zip: string;
    nbHood: string;
    country: string;
    price: number;
    propertyType: string;
    contract: string;
    beds: number;
    baths: number;
    sqMt: number;
    lotSize: number;
    listingDate: string;
    yearBuilt: number;
    status: string;
    coords: string;
    features: string;
    lat: number;
    lon: number;
    featured: boolean;
    featuredExpiresAt: string;
    mainImg: string;
    imgs: string[];
    agent: string;
    slug: string;
    agentData: string;
}

export type TPropertyFilters = {
    minPrice?: number;
    maxPrice?: number;
    minSqMt?: number;
    maxSqMt?: number;
    minLotSize?: number;
    maxLotSize?: number;
    minYearBuilt?: number;
    maxYearBuilt?: number;
    city?: string;
    state?: string;
    propType?: string;
    zip?: string;
    nbHood?: string;
    status?: string;
    featured?: boolean;
    orderBy?: string;
    orderDirection?: string;
    textSearch?: string;
    nearLat?: number;
    nearLon?: number;
    withinMeters?: number;
    contract: string;

    pagination?: TPagination;
}

export type TPagination = {
    total: number;
    page: number;
    perPage: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export type TPropertyListingResult = {
    properties: TProperty[];
    pagination: TPagination;
}

export type TPropertyDetailResult = {
    property: TProperty;
    nearbyProperties: TProperty[] | null;
}
