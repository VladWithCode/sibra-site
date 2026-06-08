import { SellingPageTemplate } from "@/components/selling-pages/SellingPageTemplate";
import { mergeSellingPage } from "@/components/selling-pages/normalize";
import type { TSellingPage } from "@/queries/type";
import { useDeferredValue, useMemo } from "react";
import { type SellingPageFormValues, formValuesToApiPage } from "./schema";

function PreviewInner({
    values,
    basePage,
}: {
    values: SellingPageFormValues;
    basePage: TSellingPage;
}) {
    // Defer to avoid re-rendering the whole template on every keystroke.
    const deferred = useDeferredValue(values);
    const data = useMemo(
        () => mergeSellingPage(formValuesToApiPage(deferred, basePage)),
        [deferred, basePage],
    );
    return <SellingPageTemplate data={data} preview />;
}

/**
 * Live preview built from the current (unsaved) form values merged over the
 * conquistadores defaults. Media + ids come from `basePage` (uploads happen
 * separately). Never submits or persists.
 */
export function SellingPagePreview({ form, basePage }: { form: any; basePage: TSellingPage }) {
    return (
        <form.Subscribe selector={(s: any) => s.values}>
            {(values: SellingPageFormValues) => (
                <PreviewInner values={values} basePage={basePage} />
            )}
        </form.Subscribe>
    );
}
