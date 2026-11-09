import { describe, expect, it } from "vitest";
import { PropertyListingSearchSchema } from "./propertyListingSearch";

describe("PropertyListingSearchSchema", () => {
    it("coerces valid query-string values", () => {
        expect(
            PropertyListingSearchSchema.parse({
                q: "centro",
                contract: "venta",
                minPrice: "1500000",
                beds: "0",
                page: "2",
                view: "map",
            }),
        ).toEqual({
            q: "centro",
            contract: "venta",
            minPrice: 1500000,
            beds: 0,
            page: 2,
            view: "map",
        });
    });

    it("drops malformed values instead of throwing", () => {
        expect(
            PropertyListingSearchSchema.parse({
                contract: "permuta",
                minPrice: "-5",
                beds: "1.5",
                page: "abc",
                perPage: "0",
                view: "grid",
            }),
        ).toEqual({ view: "list" });
    });

    it("applies defaults for an empty search", () => {
        expect(PropertyListingSearchSchema.parse({})).toEqual({});
        expect(PropertyListingSearchSchema.parse({ q: 42 })).toEqual({ q: "" });
    });
});
