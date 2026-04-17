import { queryOptions, type QueryFunctionContext } from "@tanstack/react-query";
import type { TAppealItemDeleteResult, TAppealItemDetailResult, TAppealItemsResult, TProjectAmenity, TProjectAppealItem, TProjectAssociate, TProjectAssociateDetailResult, TProjectCheckAccessData, TProjectCheckAccessResult, TProjectDeleteResult, TProjectDetailResult, TProjectDocsResult, TProjectInput, TProjectListingResult, TProjectMutationResult } from "./type";

export const ProjectQueryKeys = {
    all: () => ["projects"] as const,
    // Project listings
    listing: () => [...ProjectQueryKeys.all(), "listing"] as const,
    // Single project
    detail: () => [...ProjectQueryKeys.all(), "detail"] as const,
    byId: (id: string) =>
        [...ProjectQueryKeys.detail(), "byId", { id }] as const,
    bySlug: (slug: string) =>
        [...ProjectQueryKeys.detail(), "bySlug", { slug }] as const,
    docs: (id: string) =>
        [...ProjectQueryKeys.detail(), "docs", { id }] as const,

    // Associates
    associates: () => [...ProjectQueryKeys.all(), "associates"] as const,
    associatesByProjectId: (projectId: string) =>
        [...ProjectQueryKeys.associates(), "byProjectId", { projectId }] as const,
    associatesById: (id: string) =>
        [...ProjectQueryKeys.associates(), "byId", { id }] as const,
    associatesWithData: (projectId: string, rfcOrCurp: string, lotNum: number, appleNum: number) =>
        [...ProjectQueryKeys.associates(), "withData", { projectId, rfcOrCurp, lotNum, appleNum }] as const,

    // Mutations
    checkProjectAccess: (projectId: string, rfcOrCurp: string, lotNum: number, appleNum: number) =>
        [...ProjectQueryKeys.associates(), "checkProjectAccess", { projectId, rfcOrCurp, lotNum, appleNum }] as const,
} as const;

export const AppealItemQueryKeys = {
    all: () => ["appealItems"] as const,
    listing: () => [...AppealItemQueryKeys.all(), "listing"] as const,
    detail: () => [...AppealItemQueryKeys.all(), "detail"] as const,
    byId: (id: string) =>
        [...AppealItemQueryKeys.detail(), "byId", { id }] as const,
} as const;

export type QKAppealItemsListing = ReturnType<typeof AppealItemQueryKeys.listing>;
export type QKAppealItemById = ReturnType<typeof AppealItemQueryKeys.byId>;

export type QKProjectsListing = ReturnType<typeof ProjectQueryKeys.listing>;
export type QKProjectsDetail = ReturnType<typeof ProjectQueryKeys.detail>;
export type QKProjectsById = ReturnType<typeof ProjectQueryKeys.byId>;
export type QKProjectsBySlug = ReturnType<typeof ProjectQueryKeys.bySlug>;
export type QKProjectsDocs = ReturnType<typeof ProjectQueryKeys.docs>;

export type QKProjectsAssociates = ReturnType<typeof ProjectQueryKeys.associates>;
export type QKProjectsAssociatesByProjectId = ReturnType<typeof ProjectQueryKeys.associatesByProjectId>;
export type QKProjectsAssociatesById = ReturnType<typeof ProjectQueryKeys.associatesById>;
export type QKProjectsAssociatesWithData = ReturnType<typeof ProjectQueryKeys.associatesWithData>;
export type QKProjectsCheckProjectAccess = ReturnType<typeof ProjectQueryKeys.checkProjectAccess>;

export const getProjectsOpts = queryOptions({
    queryKey: ProjectQueryKeys.listing(),
    queryFn: getProjects,
});

export const getProjectOpts = (id: string) => queryOptions({
    queryKey: ProjectQueryKeys.byId(id),
    queryFn: getProject,
});

export const getProjectBySlugOpts = (slug: string) => queryOptions({
    queryKey: ProjectQueryKeys.bySlug(slug),
    queryFn: getProjectBySlug,
});

export const getProjectDocsOpts = (id: string) => queryOptions({
    queryKey: ProjectQueryKeys.docs(id),
    queryFn: getProjectDocs,
});

export const getProjectAssociatesOpts = (projectId: string) => queryOptions({
    queryKey: ProjectQueryKeys.associatesByProjectId(projectId),
    queryFn: getProjectAssociates,
});

export const getProjectAssociateByIdOpts = (id: string) => queryOptions({
    queryKey: ProjectQueryKeys.associatesById(id),
    queryFn: getProjectAssociateById,
});

export async function getProjects(): Promise<TProjectListingResult> {
    const response = await fetch("/api/proyectos");
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.message || "Error al obtener la información de los proyectos");
    }

    return data;
}

export async function getProject({ queryKey }: QueryFunctionContext<QKProjectsById>): Promise<TProjectDetailResult> {
    const { id } = queryKey[3];
    const response = await fetch(`/api/proyectos/${id}`);
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.message || "Error al obtener la información del proyecto");
    }

    return data;
}

export async function getProjectBySlug({ queryKey }: QueryFunctionContext<QKProjectsBySlug>): Promise<TProjectDetailResult> {
    const { slug } = queryKey[3];
    const response = await fetch(`/api/proyectos/${slug}`);
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.message || "Error al obtener la propiedad");
    }

    return data;
}

export async function getProjectDocs({ queryKey }: QueryFunctionContext<QKProjectsDocs>): Promise<TProjectDocsResult> {
    const { id } = queryKey[3];
    const response = await fetch(`/api/proyectos/${id}/documentos`);
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.message || "Error al obtener la información de los documentos");
    }

    return data;
}

export async function getProjectAssociates({ queryKey }: QueryFunctionContext<QKProjectsAssociatesByProjectId>): Promise<TProjectAssociate[]> {
    const { projectId } = queryKey[3];
    const response = await fetch(`/api/proyectos/${projectId}/socios`);
    const data = await response.json();

    return data.associates;
}

export async function getProjectAssociateById({ queryKey }: QueryFunctionContext<QKProjectsAssociatesById>): Promise<TProjectAssociateDetailResult> {
    const { id } = queryKey[3];
    const response = await fetch(`/api/proyectos/socios/${id}`);
    const data = await response.json();

    return data.associate;
}

export async function checkProjectAccess(accessData: TProjectCheckAccessData): Promise<TProjectCheckAccessResult> {
    const { projectId, idcode } = accessData;

    let url = "/api/proyectos/" + projectId + "/acceso";
    if (idcode === "") {
        throw new Error("RFC o CURP no puede estar vacío");
    }

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(accessData),
    });
    const data = await response.json();

    switch (response.status) {
        case 200:
            return { authorized: data.authorized, associate: data.associate };
        case 401:
            return { authorized: false, etc: data.etc };
        default:
            throw new Error(data.error || "Error al buscar acceso al proyecto");
    }
}

async function jsonFetch<T>(url: string, init: RequestInit, fallbackMsg: string): Promise<T> {
    const response = await fetch(url, init);
    const data = await response.json();

    if (response.status < 200 || response.status >= 300) {
        throw new Error(data.error || data.message || fallbackMsg);
    }

    return data as T;
}

// Project CRUD mutations

export async function createProject(input: TProjectInput): Promise<TProjectMutationResult> {
    return jsonFetch<TProjectMutationResult>("/api/proyectos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    }, "Error al crear el proyecto");
}

export async function updateProject(id: string, input: TProjectInput): Promise<TProjectMutationResult> {
    return jsonFetch<TProjectMutationResult>(`/api/proyectos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    }, "Error al actualizar el proyecto");
}

export async function deleteProject(id: string): Promise<TProjectDeleteResult> {
    return jsonFetch<TProjectDeleteResult>(`/api/proyectos/${id}`, {
        method: "DELETE",
    }, "Error al eliminar el proyecto");
}

// Media mutations — main image

export type TUploadProjectMainImgInput = { projectId: string; file: File };

export async function uploadProjectMainImg({ projectId, file }: TUploadProjectMainImgInput): Promise<TProjectMutationResult> {
    const fd = new FormData();
    fd.append("file", file);
    return jsonFetch<TProjectMutationResult>(`/api/proyectos/${projectId}/medios/principal`, {
        method: "PUT",
        body: fd,
    }, "Error al subir la imagen principal");
}

export async function removeProjectMainImg(projectId: string): Promise<{ success: true }> {
    return jsonFetch<{ success: true }>(`/api/proyectos/${projectId}/medios/principal`, {
        method: "DELETE",
    }, "Error al eliminar la imagen principal");
}

// Media mutations — gallery

export type TUploadProjectGalleryInput = { projectId: string; files: File[] };

export async function uploadProjectGallery({ projectId, files }: TUploadProjectGalleryInput): Promise<TProjectMutationResult> {
    const fd = new FormData();
    for (const f of files) fd.append("file", f);
    return jsonFetch<TProjectMutationResult>(`/api/proyectos/${projectId}/medios/galeria`, {
        method: "PUT",
        body: fd,
    }, "Error al subir la galería");
}

export async function removeFromProjectGallery({ projectId, imgId }: { projectId: string; imgId: string }): Promise<{ success: true }> {
    return jsonFetch<{ success: true }>(`/api/proyectos/${projectId}/medios/galeria/${imgId}`, {
        method: "DELETE",
    }, "Error al eliminar la imagen de la galería");
}

// Media mutations — amenities

export type TProjectAmenityFormInput = {
    projectId: string;
    name: string;
    icon: string;
    file?: File;
};

export async function uploadProjectAmenity({ projectId, name, icon, file }: TProjectAmenityFormInput): Promise<TProjectMutationResult> {
    const fd = new FormData();
    fd.append("name", name);
    fd.append("icon", icon);
    if (file) fd.append("file", file);
    return jsonFetch<TProjectMutationResult>(`/api/proyectos/${projectId}/medios/amenidades`, {
        method: "PUT",
        body: fd,
    }, "Error al subir la amenidad");
}

export async function updateProjectAmenity({ projectId, amenityId, name, icon, file }: TProjectAmenityFormInput & { amenityId: string }): Promise<{ success: true; amenity?: TProjectAmenity; project?: TProjectMutationResult["project"] }> {
    const fd = new FormData();
    fd.append("name", name);
    fd.append("icon", icon);
    if (file) fd.append("file", file);
    return jsonFetch(`/api/proyectos/${projectId}/medios/amenidades/${amenityId}`, {
        method: "PUT",
        body: fd,
    }, "Error al actualizar la amenidad");
}

export async function deleteProjectAmenity({ projectId, amenityId }: { projectId: string; amenityId: string }): Promise<{ success: true }> {
    return jsonFetch<{ success: true }>(`/api/proyectos/${projectId}/medios/amenidades/${amenityId}`, {
        method: "DELETE",
    }, "Error al eliminar la amenidad");
}

// Media mutations — availability image

export async function uploadProjectAvailability({ projectId, file }: { projectId: string; file: File }): Promise<TProjectMutationResult> {
    const fd = new FormData();
    fd.append("file", file);
    return jsonFetch<TProjectMutationResult>(`/api/proyectos/${projectId}/medios/disponibilidad`, {
        method: "PUT",
        body: fd,
    }, "Error al subir la imagen de disponibilidad");
}

export async function removeProjectAvailability(projectId: string): Promise<{ success: true }> {
    return jsonFetch<{ success: true }>(`/api/proyectos/${projectId}/medios/disponibilidad`, {
        method: "DELETE",
    }, "Error al eliminar la imagen de disponibilidad");
}

// Doc mutations

export type TCreateProjectDocInput = {
    projectId: string;
    file: File;
    filename: string;
    description?: string;
};

export async function createProjectDoc({ projectId, file, filename, description }: TCreateProjectDocInput): Promise<{ success: true; project: TProjectMutationResult["project"] }> {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("filename", filename);
    if (description) fd.append("description", description);
    return jsonFetch(`/api/proyectos/${projectId}/documentos`, {
        method: "POST",
        body: fd,
    }, "Error al subir el documento");
}

export async function removeProjectDoc({ projectId, docId }: { projectId: string; docId: string }): Promise<{ success: true }> {
    return jsonFetch<{ success: true }>(`/api/proyectos/${projectId}/documentos/${docId}`, {
        method: "DELETE",
    }, "Error al eliminar el documento");
}

// Associate mutations

export type TAssociateInput = Partial<TProjectAssociate>;

export async function createAssociate(input: TAssociateInput): Promise<{ success: true; associate: TProjectAssociate }> {
    return jsonFetch(`/api/socios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    }, "Error al crear el socio");
}

export async function updateAssociate(id: string, input: TAssociateInput): Promise<{ success: true; associate: TProjectAssociate }> {
    return jsonFetch(`/api/socios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    }, "Error al actualizar el socio");
}

export async function deleteAssociate(id: string): Promise<{ success: true }> {
    return jsonFetch<{ success: true }>(`/api/socios/${id}`, {
        method: "DELETE",
    }, "Error al eliminar el socio");
}

export type TProjectAssociateRelInput = {
    projectId: string;
    associateId: string;
    pendingPayment: boolean;
    lotNum?: string;
    appleNum?: string;
};

export async function addProjectAssociate({ projectId, associateId, ...rest }: TProjectAssociateRelInput): Promise<{ success: true; associate: TProjectAssociate }> {
    return jsonFetch(`/api/proyectos/${projectId}/socios/${associateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rest),
    }, "Error al asociar el socio al proyecto");
}

export async function updateProjectAssociate({ projectId, associateId, pendingPayment }: { projectId: string; associateId: string; pendingPayment: boolean }): Promise<{ success: true; associate: TProjectAssociate }> {
    return jsonFetch(`/api/proyectos/${projectId}/socios/${associateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingPayment }),
    }, "Error al actualizar la relación socio-proyecto");
}

export async function removeProjectAssociate({ projectId, associateId }: { projectId: string; associateId: string }): Promise<{ success: true }> {
    return jsonFetch<{ success: true }>(`/api/proyectos/${projectId}/socios/${associateId}`, {
        method: "DELETE",
    }, "Error al eliminar la relación socio-proyecto");
}

// Appeal item queries + mutations

export const getAppealItemsOpts = queryOptions({
    queryKey: AppealItemQueryKeys.listing(),
    queryFn: getAppealItems,
});

export const getAppealItemByIdOpts = (id: string) => queryOptions({
    queryKey: AppealItemQueryKeys.byId(id),
    queryFn: getAppealItemById,
});

export async function getAppealItems(): Promise<TAppealItemsResult> {
    return jsonFetch<TAppealItemsResult>("/api/atractivos", {}, "Error al obtener los atractivos");
}

export async function getAppealItemById({ queryKey }: QueryFunctionContext<QKAppealItemById>): Promise<TAppealItemDetailResult> {
    const { id } = queryKey[3];
    return jsonFetch<TAppealItemDetailResult>(`/api/atractivos/${id}`, {}, "Error al obtener el atractivo");
}

export type TAppealItemInput = Partial<TProjectAppealItem>;

export async function createAppealItem(input: TAppealItemInput): Promise<TAppealItemDetailResult> {
    return jsonFetch<TAppealItemDetailResult>("/api/atractivos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    }, "Error al crear el atractivo");
}

export async function updateAppealItem(id: string, input: TAppealItemInput): Promise<TAppealItemDetailResult> {
    return jsonFetch<TAppealItemDetailResult>(`/api/atractivos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    }, "Error al actualizar el atractivo");
}

export async function deleteAppealItem(id: string): Promise<TAppealItemDeleteResult> {
    return jsonFetch<TAppealItemDeleteResult>(`/api/atractivos/${id}`, {
        method: "DELETE",
    }, "Error al eliminar el atractivo");
}
