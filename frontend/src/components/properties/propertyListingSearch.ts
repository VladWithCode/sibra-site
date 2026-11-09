import * as z from "zod/mini";
import { optionalParam, positiveIntParam } from "@/lib/searchParams";
import type { TPropertyFilters } from "@/queries/type";

// Kept apart from PropertyListingFilters.tsx: the listing route's validateSearch
// runs eagerly, so anything it imports ships in the entry chunk.
export const PropertyListingSearchSchema = z.object({
    q: z.catch(z.optional(z.string()), ""),
    contract: optionalParam(z.enum(["venta", "renta"])),
    minPrice: optionalParam(z.coerce.number().check(z.positive())),
    maxPrice: optionalParam(z.coerce.number().check(z.positive())),
    beds: optionalParam(z.coerce.number().check(z.int(), z.nonnegative())),
    baths: optionalParam(z.coerce.number().check(z.int(), z.nonnegative())),
    minSqMt: optionalParam(z.coerce.number().check(z.positive())),
    maxSqMt: optionalParam(z.coerce.number().check(z.positive())),
    minLotSize: optionalParam(z.coerce.number().check(z.positive())),
    maxLotSize: optionalParam(z.coerce.number().check(z.positive())),
    minYearBuilt: positiveIntParam(),
    propType: optionalParam(z.enum(["casa", "apartamento", "terreno"])),
    page: positiveIntParam(),
    perPage: positiveIntParam(),
    view: z.catch(z.optional(z.enum(["list", "map"])), "list"),
});

export type TListingSearch = z.infer<typeof PropertyListingSearchSchema>;

export function propertyListingSearchToFilters(
    search: TListingSearch,
): Partial<TPropertyFilters> {
    return {
        contract: search.contract,
        textSearch: search.q ?? "",
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
        beds: search.beds,
        baths: search.baths,
        minSqMt: search.minSqMt,
        maxSqMt: search.maxSqMt,
        minLotSize: search.minLotSize,
        maxLotSize: search.maxLotSize,
        minYearBuilt: search.minYearBuilt,
        propType: search.propType,
        page: search.page,
        perPage: search.perPage,
    };
}
