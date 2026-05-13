import { BlogMarkdown } from "@/components/blog/BlogMarkdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRef, useState } from "react";
import { BlogImageUpload } from "./BlogImageUpload";

type ErrorList = Array<{ message?: string } | undefined>;
function errsOf(field: { state: { meta: { errors: unknown } } }): ErrorList {
    return field.state.meta.errors as unknown as ErrorList;
}

export function ContentSection({ form }: { form: any }) {
    const [tab, setTab] = useState<"write" | "preview">("write");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Contenido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <form.Field name="content">
                    {(field: any) => {
                        const insertAtCursor = (md: string) => {
                            const ta = textareaRef.current;
                            const current: string = field.state.value ?? "";
                            if (!ta) {
                                const sep = current.length > 0 && !current.endsWith("\n") ? "\n" : "";
                                field.handleChange(current + sep + md + "\n");
                                return;
                            }
                            const start = ta.selectionStart ?? current.length;
                            const end = ta.selectionEnd ?? current.length;
                            const prefix = current.slice(0, start);
                            const suffix = current.slice(end);
                            const sep = prefix.length > 0 && !prefix.endsWith("\n") ? "\n" : "";
                            const next = prefix + sep + md + "\n" + suffix;
                            field.handleChange(next);
                            requestAnimationFrame(() => {
                                ta.focus();
                                const pos = (prefix + sep + md + "\n").length;
                                ta.setSelectionRange(pos, pos);
                            });
                        };

                        return (
                            <div className="space-y-2">
                                <Tabs value={tab} onValueChange={(v) => setTab(v as "write" | "preview")}>
                                    <TabsList className="mb-2">
                                        <TabsTrigger value="write">Escritura</TabsTrigger>
                                        <TabsTrigger value="preview">Previsualización</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="write">
                                        <textarea
                                            ref={textareaRef}
                                            id="content"
                                            value={field.state.value ?? ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            rows={24}
                                            placeholder="# Título del artículo&#10;&#10;Escribe tu contenido en Markdown aquí…"
                                            spellCheck
                                            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                                            style={{ minHeight: "480px" }}
                                        />
                                    </TabsContent>

                                    <TabsContent value="preview">
                                        {field.state.value ? (
                                            <div className="w-full rounded-md border border-input bg-surface-container-lowest px-6 py-5 overflow-auto" style={{ minHeight: "480px" }}>
                                                <BlogMarkdown content={field.state.value} />
                                            </div>
                                        ) : (
                                            <div className="rounded-md border border-input bg-surface-container px-4 py-3 text-sm text-on-surface-variant" style={{ minHeight: "200px" }}>
                                                Escribe contenido en la pestaña de escritura para ver la previsualización.
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>

                                <FieldError errors={errsOf(field)} />
                                <BlogImageUpload onInsert={insertAtCursor} />
                            </div>
                        );
                    }}
                </form.Field>
            </CardContent>
        </Card>
    );
}
