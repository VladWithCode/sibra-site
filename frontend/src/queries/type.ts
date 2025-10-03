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
    ids?: string[];
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

export type TQuotePropType = "proyecto" | "propiedad" | "general";

export type TQuoteStatus = "pendiente" | "atendida" | "confirmada" | "volver a atender";

export type TQuote = {
    id: string;
    type: TQuoteType;
    propType: TQuotePropType;
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

export type TProjectDetailResult = {
    project: TProject;
};

export type TProjectAmenity = {
    id: string;
    name: string;
    icon: string;
    img: string;
};

export type TProjectDocsResult = {
    success: boolean;
    docs: TProjectDoc[];
}

export type TProjectDoc = {
    id: string;
    name: string;
    description: string;

    created_at: string;
    updated_at: string;
};

export type TProject = {
    id: string;
    slug: string;
    name: string;
    description: string;
    main_img: string;
    availability_img: string;
    gallery: string[];

    amenities: TProjectAmenity[];
    associates: TProjectAssociate[];
    docs: TProjectDoc[];
    lat?: number;
    lon?: number;

    created_at: string;
    updated_at: string;
}

export type TProjectListingResult = {
    success?: boolean;
    projects: TProject[];
};

export type TProjectAssociateDetailResult = {
    associate: TProjectAssociate;
};

export type TProjectCheckAccessResult = {
    authorized: true;
    associate: TProjectAssociate;
} | {
    authorized: false;
    etc: Record<string, any>;
};

export type TProjectAssociate = {
    id: string;
    name: string;
    phone: string;
    rfc: string;
    curp: string;
    pendingPayment: boolean;
}

export type TProjectCheckAccessData = {
    projectId: string;
    idcode: string;
    lotNum: string;
    appleNum: string;
}
