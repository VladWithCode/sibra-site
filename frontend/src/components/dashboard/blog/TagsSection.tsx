import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBlogTagsOpts, createBlogTagOpts, deleteBlogTag } from "@/queries/blog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfileOpts } from "@/queries/auth";
import { BlogQueryKeys } from "@/queries/blog";
import { Plus, Trash2, Tag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { TBlogTag } from "@/queries/type";

export function TagsSection({ form }: { form: any }) {
    const { data: tagsData, isLoading } = useQuery(getBlogTagsOpts);
    const { data: profile } = useQuery(getProfileOpts);
    const isAdmin = profile?.user?.role === "admin";

    const qc = useQueryClient();
    const createMut = useMutation(createBlogTagOpts());
    const deleteMut = useMutation({
        mutationFn: deleteBlogTag,
        onSuccess: () => qc.invalidateQueries({ queryKey: BlogQueryKeys.tags() }),
    });

    const [newTagName, setNewTagName] = useState("");

    const allTags: TBlogTag[] = tagsData?.tags ?? [];

    const onCreateTag = () => {
        const name = newTagName.trim();
        if (!name) return;
        createMut.mutate(
            { name },
            {
                onSuccess: () => {
                    setNewTagName("");
                    toast.success("Tag creado.", { closeButton: true });
                },
                onError: (err) => toast.error(err.message, { closeButton: true }),
            },
        );
    };

    const onDeleteTag = (tag: TBlogTag) => {
        deleteMut.mutate(
            { id: tag.id },
            {
                onSuccess: () => toast.success(`Tag "${tag.name}" eliminado.`, { closeButton: true }),
                onError: (err: Error) => toast.error(err.message, { closeButton: true }),
            },
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <form.Field name="tagIds">
                    {(field: any) => {
                        const selected: string[] = field.state.value ?? [];
                        const toggle = (id: string) => {
                            const next = selected.includes(id)
                                ? selected.filter((x) => x !== id)
                                : [...selected, id];
                            field.handleChange(next);
                        };

                        if (isLoading) {
                            return (
                                <div className="flex gap-2 flex-wrap">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="h-8 w-20 rounded-full bg-surface-container animate-pulse" />
                                    ))}
                                </div>
                            );
                        }

                        if (allTags.length === 0) {
                            return (
                                <p className="text-sm text-outline">
                                    No hay tags disponibles. Crea uno abajo.
                                </p>
                            );
                        }

                        return (
                            <div className="flex flex-wrap gap-2">
                                {allTags.map((tag) => {
                                    const active = selected.includes(tag.id);
                                    return (
                                        <div key={tag.id} className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => toggle(tag.id)}
                                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                                                    active
                                                        ? "bg-sbr-blue text-white border-sbr-blue"
                                                        : "bg-surface-container text-on-surface-variant border-outline-variant/30 hover:border-sbr-blue/40"
                                                }`}
                                            >
                                                <Tag className="size-3" />
                                                {tag.name}
                                            </button>
                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    title={`Eliminar tag ${tag.name}`}
                                                    onClick={() => onDeleteTag(tag)}
                                                    disabled={deleteMut.isPending}
                                                    className="p-1 text-on-surface-variant hover:text-destructive hover:bg-destructive/5 rounded-full transition-all disabled:opacity-40"
                                                >
                                                    <Trash2 className="size-3" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    }}
                </form.Field>

                {/* Create tag inline */}
                <div className="flex gap-2 pt-2 border-t border-outline-variant/20">
                    <Input
                        placeholder="Nuevo tag…"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onCreateTag(); } }}
                        className="h-8 text-sm"
                    />
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!newTagName.trim() || createMut.isPending}
                        onClick={onCreateTag}
                        className="shrink-0"
                    >
                        <Plus className="size-3.5" />
                        {createMut.isPending ? "Creando…" : "Crear"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
