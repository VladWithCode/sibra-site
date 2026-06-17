import { PropertyImage } from "@/components/Image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
    TProperty,
    TPropertyDetail,
    TPropertyDetailCategory,
    TPropertyNamedImage,
} from "@/queries/type";
import { ImageOff, LayoutList, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { LucideIcon, resolveIconName } from "./LucideIcon";
import { DETAIL_CATEGORIES } from "./schema";

const CATEGORY_LABELS: Record<TPropertyDetailCategory, string> = {
    interior: "Interior",
    exterior: "Exterior",
};

export function DetailsSection({ form, property }: { form: any; property?: TProperty }) {
    const [category, setCategory] = useState<TPropertyDetailCategory>("interior");
    const gallery = property?.imgs ?? [];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <LayoutList className="size-5" />
                    Detalles de la propiedad
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                    Características e imágenes nombradas que se muestran en la ficha técnica,
                    agrupadas por interior y exterior.
                </p>
            </CardHeader>
            <CardContent>
                <Tabs
                    value={category}
                    onValueChange={(v) => setCategory(v as TPropertyDetailCategory)}
                >
                    <TabsList>
                        {DETAIL_CATEGORIES.map((c) => (
                            <TabsTrigger key={c} value={c}>
                                {CATEGORY_LABELS[c]}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    {DETAIL_CATEGORIES.map((c) => (
                        <TabsContent key={c} value={c} className="space-y-8 pt-6">
                            <NamedImagesEditor
                                form={form}
                                category={c}
                                gallery={gallery}
                                property={property}
                            />
                            <DetailRowsEditor form={form} category={c} />
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    );
}

function DetailRowsEditor({
    form,
    category,
}: {
    form: any;
    category: TPropertyDetailCategory;
}) {
    return (
        <form.Field name="details">
            {(field: any) => {
                const all = (field.state.value ?? []) as TPropertyDetail[];
                const rows = all
                    .map((item, idx) => ({ item, idx }))
                    .filter(({ item }) => item.category === category);

                const addRow = () =>
                    field.handleChange([
                        ...all,
                        { category, icon: "", name: "", value: "", position: all.length },
                    ]);
                const updateAt = (idx: number, patch: Partial<TPropertyDetail>) => {
                    const next = all.slice();
                    next[idx] = { ...next[idx], ...patch };
                    field.handleChange(next);
                };
                const removeAt = (idx: number) =>
                    field.handleChange(all.filter((_, i) => i !== idx));

                return (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold">Características</h4>
                            <Button type="button" variant="outline" size="sm" onClick={addRow}>
                                <Plus className="size-4" />
                                Agregar
                            </Button>
                        </div>
                        {rows.length === 0 ? (
                            <p className="text-muted-foreground rounded-md border border-dashed p-4 text-center text-sm">
                                Sin características. Usa “Agregar” para registrar una.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {rows.map(({ item, idx }) => {
                                    const resolved = resolveIconName(item.icon);
                                    return (
                                        <div
                                            key={idx}
                                            className="grid grid-cols-[auto_1fr] items-start gap-2 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.5fr)_auto]"
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <Input
                                                    value={item.icon}
                                                    onChange={(e) =>
                                                        updateAt(idx, { icon: e.target.value })
                                                    }
                                                    placeholder="Ícono"
                                                    className="w-24"
                                                />
                                                <div className="bg-muted/40 flex size-9 shrink-0 items-center justify-center rounded-md border">
                                                    {resolved ? (
                                                        <LucideIcon
                                                            name={item.icon}
                                                            className="text-primary size-5"
                                                        />
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">
                                                            ?
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Input
                                                value={item.name}
                                                onChange={(e) =>
                                                    updateAt(idx, { name: e.target.value })
                                                }
                                                placeholder="Nombre (ej. Cocina)"
                                            />
                                            <Input
                                                value={item.value}
                                                onChange={(e) =>
                                                    updateAt(idx, { value: e.target.value })
                                                }
                                                placeholder="Valor (ej. Integral equipada)"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeAt(idx)}
                                                className="text-destructive"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            }}
        </form.Field>
    );
}

function NamedImagesEditor({
    form,
    category,
    gallery,
    property,
}: {
    form: any;
    category: TPropertyDetailCategory;
    gallery: string[];
    property?: TProperty;
}) {
    return (
        <form.Field name="namedImages">
            {(field: any) => {
                const all = (field.state.value ?? []) as TPropertyNamedImage[];
                const selected = all
                    .map((item, idx) => ({ item, idx }))
                    .filter(({ item }) => item.category === category);
                const selectedImages = new Set(selected.map(({ item }) => item.image));
                const available = gallery.filter((img) => !selectedImages.has(img));

                const addImage = (image: string) =>
                    field.handleChange([
                        ...all,
                        { category, image, caption: "", position: all.length },
                    ]);
                const updateAt = (idx: number, patch: Partial<TPropertyNamedImage>) => {
                    const next = all.slice();
                    next[idx] = { ...next[idx], ...patch };
                    field.handleChange(next);
                };
                const removeAt = (idx: number) =>
                    field.handleChange(all.filter((_, i) => i !== idx));

                return (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold">Imágenes nombradas</h4>

                        {gallery.length === 0 ? (
                            <div className="text-muted-foreground flex items-center gap-2 rounded-md border border-dashed p-4 text-sm">
                                <ImageOff className="size-4 shrink-0" />
                                Sube imágenes a la galería y guarda la propiedad para poder
                                nombrarlas aquí.
                            </div>
                        ) : (
                            <>
                                {selected.length > 0 && (
                                    <div className="space-y-2">
                                        {selected.map(({ item, idx }) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-3 rounded-md border p-2"
                                            >
                                                <div className="size-14 shrink-0 overflow-hidden rounded-md border">
                                                    <PropertyImage
                                                        propId={property?.id ?? ""}
                                                        propName={item.caption || item.image}
                                                        src={item.image}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <Input
                                                    value={item.caption}
                                                    onChange={(e) =>
                                                        updateAt(idx, {
                                                            caption: e.target.value,
                                                        })
                                                    }
                                                    placeholder="Nombre (ej. Cocina)"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeAt(idx)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {available.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-muted-foreground text-xs">
                                            Toca una imagen de la galería para nombrarla:
                                        </p>
                                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                            {available.map((img) => (
                                                <button
                                                    key={img}
                                                    type="button"
                                                    onClick={() => addImage(img)}
                                                    className="hover:ring-primary group relative aspect-[4/3] overflow-hidden rounded-md border transition hover:ring-2"
                                                >
                                                    <PropertyImage
                                                        propId={property?.id ?? ""}
                                                        propName={img}
                                                        src={img}
                                                        className="h-full w-full object-cover"
                                                    />
                                                    <span className="bg-background/80 absolute inset-x-0 bottom-0 flex items-center justify-center py-1 opacity-0 backdrop-blur transition group-hover:opacity-100">
                                                        <Plus className="size-4" />
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                );
            }}
        </form.Field>
    );
}
