import { queryOptions, type QueryFunctionContext } from "@tanstack/react-query";
import type { TProject, TProjectAssociate, TProjectAssociateDetailResult, TProjectCheckAccessData, TProjectCheckAccessResult, TProjectDetailResult, TProjectDocsResult } from "./type";

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

export async function getProjects(): Promise<TProject[]> {
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
