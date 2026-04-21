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

export type TPropertyStatus = "borrador" | "archivada" | "publicada" | "en_revision" | "vendida" | "no_disponible";
export type TPropertyType = "casa" | "apartamento" | "terreno";
export type TPropertyContract = "venta" | "renta";

export type TPropertyFeature = {
    id: string;
    icon: string;
    title: string;
    description: string;
};

export type TPropertyAmenity = {
    id: string;
    icon: string;
    title: string;
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
    propertyType: TPropertyType;
    contract: TPropertyContract;
    beds: number;
    baths: number;
    sqMt: number;
    lotSize: number;
    listingDate: string;
    yearBuilt: number;
    status: TPropertyStatus;
    coords: string;
    features: TPropertyFeature[];
    amenities: TPropertyAmenity[];
    lat: number;
    lon: number;
    featured: boolean;
    featuredExpiresAt: string;
    mainImg: string;
    imgs: string[];
    agent: string;
    slug: string;
    agentData: {
        name: string;
        phone: string;
        img: string;
    };
};

export type TPropertyFilters = Partial<TProperty> & {
    ids?: string[];
    contract: string;
    textSearch?: string;
    propType?: TPropertyType;
    minPrice?: number;
    maxPrice?: number;
    minSqMt?: number;
    maxSqMt?: number;
    minLotSize?: number;
    maxLotSize?: number;
    minYearBuilt?: number;
    maxYearBuilt?: number;

    page?: TPagination["page"];
    perPage?: TPagination["perPage"];
};

export type TPropertyListingResult = {
    properties: TProperty[];
    pagination: TPagination;
};

export type TPropertyDetailResult = {
    property: TProperty;
    success?: boolean;
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

export type TConqsQuoteSchedule = "fin de semana" | "entre semana" | "otro";

export type TQuoteConquistadores = TQuote & {
    schedule: TConqsQuoteSchedule;
}

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

export type TContactRequest = {
    name: string;
    phone: string;
}

export type TPropInfoRequest = TContactRequest & {
    id: string;
    property: string;
    status: string;
    date: string;
    updatedAt: string;
};

export type TContactRequestCreateResult =
    | { success: true; request: TContactRequest }
    | { error: string; etc?: Record<string, any> };

export type TPropInfoRequestCreateResult =
    | { success: true; request: TPropInfoRequest }
    | { error: string; etc?: Record<string, any> };

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

export type TProjectAppealItem = {
    id: string;
    name: string;
    description: string;
};

export type TProject = {
    id: string;
    slug: string;
    name: string;
    description: string;
    quote: string;
    summary: string;
    location: string;
    main_img: string;
    availability_img: string;
    gallery: string[];

    total_area: number;
    lot_count: number;
    available_lots: number;

    amenities: TProjectAmenity[];
    associates: TProjectAssociate[];
    docs: TProjectDoc[];
    appeal_list: TProjectAppealItem[];

    lat?: number;
    lon?: number;

    created_at: string;
    updated_at: string;
}

export type TProjectInput = Partial<Omit<TProject, "created_at" | "updated_at">>;

export type TProjectListingResult = {
    success?: boolean;
    projects: TProject[];
};

export type TProjectMutationResult = {
    success: true;
    project: TProject;
};

export type TProjectDeleteResult = {
    success: true;
};

export type TAppealItemsResult = {
    success: boolean;
    items: TProjectAppealItem[];
};

export type TAppealItemDetailResult = {
    success: boolean;
    item: TProjectAppealItem;
};

export type TAppealItemDeleteResult = {
    success: true;
};

export type TProjectAssociatesByDataResult = {
    success: true;
    associates: TProjectAssociate[];
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
    lotNum?: string;
    appleNum?: string;
    pendingPayment: boolean;
}

export type TProjectAssociateFilter = { rfcOrCurp?: string } & Partial<TProjectAssociate>;

export type TProjectCheckAccessData = {
    projectId: string;
    idcode: string;
    lotNum: string;
    appleNum: string;
}

// Users
export type TUserRole = "admin" | "editor" | "user";
export type TUser = {
    id: string;
    name: string;
    username: string;
    role: TUserRole;
    email: string;
    phone: string;
    img: string;
}

export type TUserDetail = TUser & {
    emailVerified: boolean;
    phoneVerified: boolean;

    createdAt: Date;
    updatedAt: Date;
}

export type TLogin = {
    username: string;
    password: string;
}

export type TUserProfileResult = {
    success: boolean;
    user: TUser;
}

export type TLoginResult = TUserProfileResult
