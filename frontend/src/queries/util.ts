export function objectToQueryString(obj: Record<string, any>) {
    let urlparams = new URLSearchParams();
    for (const [key, value] of Object.entries(obj)) {
        if (Array.isArray(value)) {
            if (value.length === 0) {
                urlparams.append(key, "");
                continue;
            }

            for (const val of value) {
                urlparams.append(key, val);
            }
            continue
        }

        if (value !== undefined) {
            urlparams.append(key, value);
        }
    }
    return urlparams.toString();
}
