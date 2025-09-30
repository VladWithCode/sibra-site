export type TRequestError = {
    error: string;
    etc?: Record<string, any>;
};

export type TPagination = {
    total: number;
    page: number;
    perPage: number;
    hasNext: boolean;
    hasPrev: boolean;
};

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
};

export type TPropertyFilters = Partial<TProperty> & {
    contract: string;

    page?: TPagination["page"];
    perPage?: TPagination["perPage"];
};

export type TPropertyListingResult = {
    properties: TProperty[];
    pagination: TPagination;
};

export type TPropertyDetailResult = {
    property: TProperty;
    nearbyProperties: TProperty[] | null;
};

export type TQuoteType = "presencial" | "whatsapp";

export type TQuoteStatus = "pendiente" | "atendida" | "confirmada" | "volver a atender";

export type TQuote = {
    id: string;
    type: TQuoteType;
    phone: string;
    name: string;
    scheduledDate: string;
    status: TQuoteStatus;
    agent: string;
    property: string;

    createdAt: string;
    updatedAt: string;
};

export type TQuoteFilters = Partial<TQuote> & {
    page?: TPagination["page"];
    perPage?: TPagination["perPage"];
};

export type TQuoteListingResult = {
    quotes: TQuote[];
    pagination: TPagination;
};

export type TQuoteDetailResult = {
    quote: TQuote;
};

export type TQuoteCreateResult = TQuoteCreateError | TQuoteCreateSuccess;

type TQuoteCreateError = {
    message: string;
    etc?: Record<string, any>;
};

type TQuoteCreateSuccess = {
    success: true;
    quote: TQuote;
};
