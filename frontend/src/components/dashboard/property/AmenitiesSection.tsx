import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAmenitiesOpts } from "@/queries/amenities";
import { useQuery } from "@tanstack/react-query";
import { Trees } from "lucide-react";
import { useRef } from "react";
import { CreateAmenityDialog } from "./CreateAmenityDialog";
import { FeatureAmenityPicker, type PickerItem } from "./FeatureAmenityPicker";

export function AmenitiesSection({ form }: { form: any }) {
    const { data: items = [] } = useQuery(getAmenitiesOpts);
    const triggerRef = useRef<HTMLButtonElement>(null);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Trees className="size-5" />
                    Amenidades
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form.Field name="amenities">
                    {(field: any) => {
                        const selected = (field.state.value ?? []) as PickerItem[];
                        return (
                            <>
                                <FeatureAmenityPicker
                                    items={items as PickerItem[]}
                                    selected={selected}
                                    onChange={(next) => field.handleChange(next)}
                                    onCreateClick={() => triggerRef.current?.click()}
                                    labelSingular="amenidad"
                                />
                                <CreateAmenityDialog
                                    onCreated={(a) => {
                                        field.handleChange([...selected, a]);
                                    }}
                                >
                                    <button type="button" ref={triggerRef} className="hidden" />
                                </CreateAmenityDialog>
                            </>
                        );
                    }}
                </form.Field>
            </CardContent>
        </Card>
    );
}
