import type { TProperty } from "@/queries/type";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Property utils
export type TPropertyAddressOpts = {
    /** Refers to the street name and lot number */
    includeAddress?: boolean;
    includeNbHood?: boolean;
    includeCity?: boolean;
    includeState?: boolean;
    includeZip?: boolean;
};

const DefaultPropertyAddressOpts: TPropertyAddressOpts = {
    includeAddress: true,
    includeNbHood: true,
    includeCity: true,
    includeState: true,
    includeZip: true,
};

export function getPropertyAddress(property: TProperty, opts: TPropertyAddressOpts) {
    opts = Object.assign({}, DefaultPropertyAddressOpts, opts);
    console.log(opts);
    let result = "";
    let streetAndNbHood = "";

    if (opts.includeAddress) {
        streetAndNbHood = property.address;
        if (opts.includeNbHood) streetAndNbHood += ` ${property.nbHood}`;
    }
    result += `${streetAndNbHood}`;

    if (opts.includeCity) {
        result += `, ${property.city}`;
    }

    if (opts.includeState) {
        result += `, ${property.state}`;
    }

    if (opts.includeZip) {
        result += `. ${property.zip}`;
    }

    return result;
}
