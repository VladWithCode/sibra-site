// Route search schemas run in validateSearch, which stays in the entry chunk
// after route code splitting. They use zod/mini (tree-shakeable) instead of
// classic zod so the full zod API does not ship on every page load.
import * as z from "zod/mini";

/** Optional search param that drops a malformed value instead of throwing:
 * URLs are user-editable, so a bad param must not break the page. */
export function optionalParam<T extends z.ZodMiniType>(schema: T) {
    return z.catch(z.optional(schema), undefined);
}

/** Optional positive integer from the query string, e.g. `page` or `perPage`. */
export function positiveIntParam() {
    return optionalParam(z.coerce.number().check(z.int(), z.positive()));
}
