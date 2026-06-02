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

export type TPropertyStatus =
    | "borrador"
    | "archivada"
    | "publicada"
    | "en_revision"
    | "vendida"
    | "no_disponible";
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
    title: string;
    description: string;
    city: string;
    state: string;
    zip: string;
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
    contract?: string;
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

export type TQuoteType = "informacion" | "cita" | "venta" | "precalificacion" | "proyecto";

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
    project: string;
    date: string;

    createdAt: string;
    updatedAt: string;
};

export type TConqsQuoteSchedule = "fin de semana" | "entre semana" | "otro";

export type TQuoteConquistadores = TQuote & {
    schedule: TConqsQuoteSchedule;
};

export type TQuoteFilters = {
    type?: TQuoteType;
    name?: string;
    phone?: string;
    status?: string;
    scheduledDate?: string;
    createdAt?: string;
    page?: TPagination["page"];
    perPage?: TPagination["perPage"];
};

export type TQuoteListingResult = {
    requests: TQuote[];
    pagination: TPagination;
};

export type TQuoteDetailResult = {
    request: TQuote;
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

export type TQuoteDeleteResult = {
    success: true;
};

export type TQuoteUpdateResult = {
    success: true;
    request: TQuote;
};

export type TContactRequestType =
    | "informacion"
    | "cita"
    | "venta"
    | "precalificacion"
    | "proyecto";

export type TContactRequest = {
    name: string;
    phone: string;
    type: TContactRequestType;
};

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
};

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

export type TProjectSection = {
    id: string;
    position: number;
    title: string;
    body: string;
    image: string;
    image_side: "left" | "right";
};

export type TProject = {
    id: string;
    slug: string;
    name: string;
    quote: string;
    summary: string;
    location: string;
    main_img: string;
    availability_img: string;
    quote_img: string;
    gallery: string[];

    total_area: number;
    lot_count: number;
    available_lots: number;

    amenities: TProjectAmenity[];
    associates: TProjectAssociate[];
    docs: TProjectDoc[];
    appeal_list: TProjectAppealItem[];
    sections: TProjectSection[];

    lat?: number;
    lon?: number;

    created_at: string;
    updated_at: string;
};

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

export type TProjectCheckAccessResult =
    | {
          authorized: true;
          associate: TProjectAssociate;
      }
    | {
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
};

export type TProjectAssociateFilter = { rfcOrCurp?: string } & Partial<TProjectAssociate>;

export type TProjectCheckAccessData = {
    projectId: string;
    idcode: string;
    lotNum: string;
    appleNum: string;
};

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
};

export type TPublicUser = {
    name: string;
    email: string;
    phone: string;
    img: string;
};

export type TUserDetail = TUser & {
    emailVerified: boolean;
    phoneVerified: boolean;

    createdAt: Date;
    updatedAt: Date;
};

export type TLogin = {
    username: string;
    password: string;
};

export type TUserProfileResult = {
    success: boolean;
    user: TUser;
};

export type TLoginResult = TUserProfileResult;

export type TUserFilters = {
    search?: string;
    role?: TUserRole;
    page?: TPagination["page"];
    perPage?: TPagination["perPage"];
};

export type TUserListingResult = {
    users: TUserDetail[];
    pagination: TPagination;
};

export type TAgentListingResult = {
    users: TPublicUser[];
};

export type TUserDeleteResult = {
    success: true;
};

export type TUserDetailResult = {
    user: TUserDetail;
};

export type TUserCreateResult = {
    success: true;
    user: TUser;
};

export type TUserUpdateResult = {
    success: true;
    user: TUser;
};

// ── Blog ──────────────────────────────────────────────────────────────────────

export type TBlogPostStatus = "draft" | "published" | "archived";

export type TBlogTag = {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
};

export type TBlogPost = {
    id: string;
    slug: string;
    title: string;
    snippet: string;
    status: TBlogPostStatus;
    readingTime: number;
    authorId: string;
    contentPath: string;
    coverImage: string;
    publishedAt: string;
    archivedAt: string;
    createdAt: string;
    updatedAt: string;
    tags: TBlogTag[];
};

export type TBlogPostFilters = {
    status?: TBlogPostStatus;
    author?: string;
    search?: string;
    page?: number;
    limit?: number;
};

export type TBlogPostListingResult = {
    posts: TBlogPost[];
    pagination: TPagination;
};

export type TBlogPostDetailResult = {
    post: TBlogPost;
    content: string;
};

export type TBlogTagListingResult = {
    tags: TBlogTag[];
};

export type TBlogPostCreatePayload = {
    title: string;
    snippet?: string;
    content: string;
    coverImage?: string;
    tagIds?: string[];
};

export type TBlogPostUpdatePayload = {
    title: string;
    snippet?: string;
    content: string;
    coverImage?: string;
    tagIds?: string[];
};

export type TBlogPostStatusPayload = {
    status: TBlogPostStatus;
};

export type TBlogPostCreateResult = {
    success: true;
    post: TBlogPost;
};

export type TBlogPostUpdateResult = {
    success: true;
    post: TBlogPost;
};

export type TBlogPostStatusResult = {
    success: true;
    id: string;
    status: TBlogPostStatus;
};

export type TBlogPostDeleteResult = {
    success: true;
    id: string;
};

export type TBlogTagCreateResult = {
    success: true;
    tag: TBlogTag;
};

export type TBlogTagDeleteResult = {
    success: true;
    id: string;
};

export type TBlogImageUploadResult = {
    url: string;
    markdown: string;
};

// ---- Selling Pages (terrenos) ----
// Mirrors internal/db.SellingPage JSON. The four jsonb fields arrive as parsed
// JSON (array) or null; typed as `unknown` and coerced safely in normalize.
export type TSellingPage = {
    id: string;
    slug: string;
    name: string;
    variant: string;
    published: boolean;

    seoTitle: string;
    seoDescription: string;
    pixelId: string;
    whatsappNumber: string;
    whatsappMessage: string;

    heroVideo: string;
    heroPoster: string;
    heroImage: string;
    heroTitle: string;
    heroSubtitle: string;
    heroCtaLabel: string;
    heroCtaTarget: string;

    availabilityImg: string;
    availabilityCtaUrl: string;

    contactBgImg: string;
    contactHeading: string;

    financingHeading: string;
    financingBody: string;
    financingImg: string;

    offerPrice: string;
    offerPeriod: string;
    offerDimensions: string;
    offerFinePrint: string;
    offerLandImg: string;
    offerFeatures: unknown;

    cards: unknown;
    steps: unknown;

    locationImg: string;
    locationMapEmbed: string;
    locationCaption: string;
    locationChips: unknown;

    contactAddress: string;
    contactHours: string;
    contactPhone: string;

    createdAt: string;
    updatedAt: string;
};

export type TSellingPageResult = {
    page: TSellingPage;
};

export type TSellingPagesListResult = {
    pages: TSellingPage[];
};
