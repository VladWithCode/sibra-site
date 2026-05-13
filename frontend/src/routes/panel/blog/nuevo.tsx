import { ContentSection } from "@/components/dashboard/blog/ContentSection";
import { MainInfoSection } from "@/components/dashboard/blog/MainInfoSection";
import { TagsSection } from "@/components/dashboard/blog/TagsSection";
import {
    BlogPostFormSchema,
    blogPostFormDefaults,
} from "@/components/dashboard/blog/schema";
import { Button } from "@/components/ui/button";
import { createBlogPostOpts, getBlogTagsOpts } from "@/queries/blog";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/panel/blog/nuevo")({
    component: RouteComponent,
    loader: async ({ context }) => {
        await context.queryClient.ensureQueryData(getBlogTagsOpts);
    },
});

function RouteComponent() {
    const navigate = useNavigate();
    const createMut = useMutation(createBlogPostOpts());

    const form = useForm({
        defaultValues: blogPostFormDefaults,
        validators: { onChange: BlogPostFormSchema },
        onSubmit: async ({ value }) => {
            try {
                const result = await createMut.mutateAsync({
                    title:       value.title,
                    snippet:     value.snippet || undefined,
                    content:     value.content,
                    coverImage:  value.coverImage || undefined,
                    tagIds:      value.tagIds?.length ? value.tagIds : undefined,
                });
                toast.success("Post creado como borrador.", { closeButton: true });
                navigate({ to: "/panel/blog/$id", params: { id: result.post.id } });
            } catch (e: any) {
                toast.error(e?.message || "Error al crear el post", { closeButton: true });
            }
        },
    });

    return (
        <main className="bg-surface min-h-screen w-full p-6 lg:p-8">
            <div className="mx-auto max-w-5xl space-y-8">
                <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-1.5">
                        <span className="text-primary text-xs font-semibold tracking-widest uppercase">
                            Blog
                        </span>
                        <h1 className="text-3xl font-extrabold tracking-tight">Nuevo post</h1>
                        <p className="text-muted-foreground max-w-lg text-sm">
                            El post se guardará como borrador. Puedes publicarlo desde el listado.
                        </p>
                    </div>
                    <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
                        {({ canSubmit, isSubmitting }) => (
                            <Button
                                size="lg"
                                type="submit"
                                form="create-blog-post-form"
                                disabled={!canSubmit || isSubmitting}
                            >
                                <Save className="size-4" />
                                {isSubmitting ? "Guardando…" : "Guardar borrador"}
                            </Button>
                        )}
                    </form.Subscribe>
                </header>

                <form
                    id="create-blog-post-form"
                    className="space-y-8"
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                >
                    <MainInfoSection form={form} />
                    <ContentSection form={form} />
                    <TagsSection form={form} />
                </form>
            </div>
        </main>
    );
}
