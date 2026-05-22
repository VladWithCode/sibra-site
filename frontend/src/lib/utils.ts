import type { TProperty } from "@/queries/type";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Property utils
export type TPropertyAddressOpts = {
    includeAddress?: boolean;
    includeCity?: boolean;
    includeState?: boolean;
    includeZip?: boolean;
};

const DefaultPropertyAddressOpts: TPropertyAddressOpts = {
    includeAddress: true,
    includeCity: true,
    includeState: true,
    includeZip: true,
};

export function getPropertyAddress(property: TProperty, opts?: TPropertyAddressOpts) {
    opts = Object.assign({}, DefaultPropertyAddressOpts, opts || {});
    let result = "";

    if (opts.includeAddress) {
        result += `${property.address}`;
    }

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
