import { mutationOptions, queryOptions, type QueryFunctionContext } from "@tanstack/react-query";
import type {
    TConqsQuoteSchedule,
    TContactRequest,
    TContactRequestCreateResult,
    TQuoteDetailResult,
    TPropInfoRequest,
    TPropInfoRequestCreateResult,
    TQuote,
    TQuoteConquistadores,
    TQuoteCreateResult,
    TQuoteDeleteResult,
    TQuoteFilters,
    TQuoteListingResult,
    TQuotePropType,
    TQuoteUpdateResult,
} from "./type";
import { objectToQueryString } from "./util";
import { queryClient } from "./queryClient";

export const QuoteQueryKeys = {
    all: () => ["quotes"] as const,
    // Quote listings
    listing: () => [...QuoteQueryKeys.all(), "listing"] as const,
    filtered: (filters: TQuoteFilters) =>
        [...QuoteQueryKeys.listing(), "filtered", { filters }] as const,
    // Single quote
    detail: () => [...QuoteQueryKeys.all(), "detail"] as const,
    byId: (id: string) => [...QuoteQueryKeys.detail(), "byId", { id }] as const,

    // Mutations
    create: (propType: string) => [...QuoteQueryKeys.all(), "create", { propType }] as const,
    update: (id: string, quote: Partial<TQuote>) => [...QuoteQueryKeys.all(), "update", id, { quote }] as const,
    delete: (id: string) => [...QuoteQueryKeys.all(), "delete", { id }] as const,

    // PropInfoRequest
    createPropInfoRequest: (name: string, phone: string, property: string) => [...QuoteQueryKeys.all(), "createPropInfoRequest", { name, phone, property }] as const,
    updatePropInfoRequest: (id: string) => [...QuoteQueryKeys.all(), "updatePropInfoRequest", { id }] as const,
    deletePropInfoRequest: (id: string) => [...QuoteQueryKeys.all(), "deletePropInfoRequest", { id }] as const,

    // ContactRequest
    createContactRequest: () => [...QuoteQueryKeys.all(), "createContactRequest"] as const,
    updateContactRequest: (id: string) => [...QuoteQueryKeys.all(), "updateContactRequest", { id }] as const,
    deleteContactRequest: (id: string) => [...QuoteQueryKeys.all(), "deleteContactRequest", { id }] as const,

    // Conquistadores
    createConqsQuote: (schedule: TConqsQuoteSchedule | "") => [...QuoteQueryKeys.all(), "createConqsQuote", { schedule }] as const,
    updateConqsQuote: (id: string) => [...QuoteQueryKeys.all(), "updateConqsQuote", { id }] as const,
    deleteConqsQuote: (id: string) => [...QuoteQueryKeys.all(), "deleteConqsQuote", { id }] as const,
} as const;

export type QKQuotesListing = ReturnType<typeof QuoteQueryKeys.listing>;
export type QKQuotesFiltered = ReturnType<typeof QuoteQueryKeys.filtered>;
export type QKQuotesById = ReturnType<typeof QuoteQueryKeys.byId>;
export type QKQuotesCreate = ReturnType<typeof QuoteQueryKeys.create>;
export type QKQuotesUpdate = ReturnType<typeof QuoteQueryKeys.update>;
export type QKQuotesDelete = ReturnType<typeof QuoteQueryKeys.delete>;
export type QKQuotesCreateConqsQuote = ReturnType<typeof QuoteQueryKeys.createConqsQuote>;
export type QKQuotesUpdateConqsQuote = ReturnType<typeof QuoteQueryKeys.updateConqsQuote>;
export type QKQuotesDeleteConqsQuote = ReturnType<typeof QuoteQueryKeys.deleteConqsQuote>;

export const getQuotesOpts = (filters: TQuoteFilters) =>
    queryOptions({
        queryKey: QuoteQueryKeys.filtered(filters),
        queryFn: getQuoteListing,
    });

export const getSingleQuoteOpts = (id: string) =>
    queryOptions({
        queryKey: QuoteQueryKeys.byId(id),
        queryFn: getSingleQuote,
    });

export async function getSingleQuote({
    queryKey,
}: QueryFunctionContext<QKQuotesById>): Promise<TQuoteDetailResult> {
    const { id } = queryKey[3];
    const response = await fetch(`/api/citas/${id}`);
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Error al obtener la solicitud");
    }

    return data;
}

export async function getQuoteListing({
    queryKey,
}: QueryFunctionContext<QKQuotesFiltered>): Promise<TQuoteListingResult> {
    const { filters } = queryKey[3];
    const queryParams = objectToQueryString(filters);
    let url = "/api/citas";

    if (queryParams.length > 0) {
        url += "?" + queryParams;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.message || "Error al obtener las citas");
    }

    return data;
}

export const createQuoteOpts = (propType: TQuotePropType) => mutationOptions({
    mutationKey: QuoteQueryKeys.create(propType),
    mutationFn: createQuote,
})

export const createConqsQuoteOpts = (schedule: TConqsQuoteSchedule | "") => mutationOptions({
    mutationKey: QuoteQueryKeys.createConqsQuote(schedule),
    mutationFn: createConqsQuote,
});

export const createPropInfoRequestOpts = (property: string) => mutationOptions({
    mutationKey: QuoteQueryKeys.createPropInfoRequest("", "", property),
    mutationFn: createPropInfoRequest,
});

export const createContactRequestOpts = () => mutationOptions({
    mutationKey: QuoteQueryKeys.createContactRequest(),
    mutationFn: createContactRequest,
})

export async function createQuote(newQuote: TQuote): Promise<TQuoteCreateResult> {
    const response = await fetch("/api/contacto", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(newQuote),
    });
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Error al crear cita");
    }

    return data;
}

export async function createConqsQuote({ quoteData }: { quoteData: Partial<TQuoteConquistadores> }): Promise<TQuoteCreateResult> {
    const response = await fetch("/api/citas/conquistadores", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(quoteData),
    });
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Error al crear cita");
    }

    return data;
}

export async function createPropInfoRequest({ infoRequest }: { infoRequest: Pick<TPropInfoRequest, "name" | "phone" | "property"> }): Promise<TPropInfoRequestCreateResult> {
    const response = await fetch("/api/contacto/info-propiedad", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(infoRequest),
    });
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Error al enviar la solicitud");
    }

    return data;
}

export async function createContactRequest({ contactRequest }: { contactRequest: TContactRequest }): Promise<TContactRequestCreateResult> {
    const response = await fetch("/api/contacto", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(contactRequest),
    });
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Error al enviar la solicitud");
    }

    return data;
}

export const updateQuoteOpts = (id: string, data: Partial<TQuote>) => mutationOptions({
    mutationKey: QuoteQueryKeys.update(id, data),
    mutationFn: updateQuote,
    onSuccess: () => {
        queryClient.invalidateQueries({
            queryKey: QuoteQueryKeys.listing(),
        })
    },
});

export async function updateQuote({ id, quote }: { id: string, quote: Partial<TQuote> }): Promise<TQuoteUpdateResult> {
    if (id === "") throw new Error("No se proporciono el id de la cita a actualizar");

    const response = await fetch("/api/citas/" + id, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(quote),
    });
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Error al enviar la solicitud");
    }

    return data;
}

export const setDoneQuoteOpts = (id: string) => mutationOptions({
    mutationKey: QuoteQueryKeys.update(id, {}),
    mutationFn: setDoneQuote,
    onSuccess: () => {
        queryClient.invalidateQueries({
            queryKey: QuoteQueryKeys.listing(),
        })
    },
});

export async function setDoneQuote({ id }: { id: string }): Promise<TQuoteDeleteResult> {
    if (id === "") throw new Error("No se proporciono el id de la cita a actualizar");

    const response = await fetch("/api/citas/" + id + "/set-done", {
        method: "PUT",
    });
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Error al actualizar la solicitud");
    }

    return data;
}

export const deleteQuoteOpts = (id: string) => mutationOptions({
    mutationKey: QuoteQueryKeys.delete(id),
    mutationFn: deleteQuote,
    onSuccess: () => {
        queryClient.invalidateQueries({
            queryKey: QuoteQueryKeys.listing(),
        })
    },
});

export async function deleteQuote({ id }: { id: string }): Promise<TQuoteDeleteResult> {
    if (id === "") throw new Error("No se proporciono el id de la cita a eliminar");

    const response = await fetch("/api/citas/" + id, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || "Error al eliminar la cita");
    }

    return data;
}
