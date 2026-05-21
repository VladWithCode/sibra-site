import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { queryClient } from "./queryClient";

export type TTeamMember = {
    id: string;
    name: string;
    role: string;
    bio: string;
    photoUrl: string;
    position: number;
};

export const TeamQueryKeys = {
    all: () => ["teamMembers"] as const,
    listing: () => [...TeamQueryKeys.all(), "listing"] as const,
    detail: (id: string) => [...TeamQueryKeys.all(), "detail", { id }] as const,
} as const;

export const getTeamMembersOpts = queryOptions({
    queryKey: TeamQueryKeys.listing(),
    queryFn: getTeamMembers,
});

export const getTeamMemberOpts = (id: string) =>
    queryOptions({
        queryKey: TeamQueryKeys.detail(id),
        queryFn: () => getTeamMemberById(id),
    });

export const createTeamMemberOpts = () =>
    mutationOptions({
        mutationKey: TeamQueryKeys.listing(),
        mutationFn: createTeamMember,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TeamQueryKeys.listing() });
        },
    });

export const updateTeamMemberOpts = (id: string) =>
    mutationOptions({
        mutationKey: TeamQueryKeys.detail(id),
        mutationFn: updateTeamMember,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TeamQueryKeys.all() });
        },
    });

export const deleteTeamMemberOpts = () =>
    mutationOptions({
        mutationKey: TeamQueryKeys.listing(),
        mutationFn: deleteTeamMember,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TeamQueryKeys.listing() });
        },
    });

export const uploadTeamMemberPhotoOpts = () =>
    mutationOptions({
        mutationKey: ["teamMembers", "photo"],
        mutationFn: ({ id, file }: { id: string; file: File }) => uploadTeamMemberPhoto(id, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: TeamQueryKeys.all() });
        },
    });

export async function getTeamMembers(): Promise<TTeamMember[]> {
    const response = await fetch("/api/team-members");
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Error al obtener los miembros del equipo");
    }
    return data.teamMembers;
}

export async function getTeamMemberById(id: string): Promise<TTeamMember> {
    const response = await fetch(`/api/team-members/${id}`);
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Error al obtener el miembro del equipo");
    }
    return data.teamMember;
}

export async function getNextPosition(): Promise<number> {
    const response = await fetch("/api/team-members/next-position");
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Error al obtener la siguiente posición");
    }
    return data.position;
}

export async function createTeamMember(member: Partial<TTeamMember>): Promise<TTeamMember> {
    const response = await fetch("/api/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Error al crear el miembro del equipo");
    }
    return data.teamMember;
}

export async function updateTeamMember(member: Partial<TTeamMember> & { id: string }): Promise<TTeamMember> {
    const response = await fetch(`/api/team-members/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Error al actualizar el miembro del equipo");
    }
    return data.teamMember;
}

export async function deleteTeamMember({ id }: { id: string }): Promise<{ success: boolean }> {
    const response = await fetch(`/api/team-members/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Error al eliminar el miembro del equipo");
    }
    return data;
}

export async function uploadTeamMemberPhoto(id: string, file: File): Promise<{ photoUrl: string; teamMember: TTeamMember }> {
    const form = new FormData();
    form.append("photo", file);
    const response = await fetch(`/api/team-members/photo/${id}`, {
        method: "POST",
        body: form,
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Error al subir la foto");
    }
    return data;
}
