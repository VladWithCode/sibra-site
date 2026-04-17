import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFeaturesOpts } from "@/queries/features";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useRef } from "react";
import { CreateFeatureDialog } from "./CreateFeatureDialog";
import { FeatureAmenityPicker, type PickerItem } from "./FeatureAmenityPicker";

export function FeaturesSection({ form }: { form: any }) {
    const { data: items = [] } = useQuery(getFeaturesOpts);
    const triggerRef = useRef<HTMLButtonElement>(null);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Sparkles className="size-5" />
                    Características
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form.Field name="features">
                    {(field: any) => {
                        const selected = (field.state.value ?? []) as PickerItem[];
                        return (
                            <>
                                <FeatureAmenityPicker
                                    items={items as PickerItem[]}
                                    selected={selected}
                                    onChange={(next) => field.handleChange(next)}
                                    onCreateClick={() => triggerRef.current?.click()}
                                    labelSingular="característica"
                                />
                                <CreateFeatureDialog
                                    onCreated={(f) => {
                                        field.handleChange([...selected, f]);
                                    }}
                                >
                                    <button type="button" ref={triggerRef} className="hidden" />
                                </CreateFeatureDialog>
                            </>
                        );
                    }}
                </form.Field>
            </CardContent>
        </Card>
    );
}
