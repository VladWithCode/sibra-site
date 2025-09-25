export function objectToQueryString(obj: Record<string, any>) {
    let urlparams = new URLSearchParams();
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
            urlparams.append(key, value);
        }
    }
    return urlparams.toString();
}
