export function rlazyLoad(path: string, namedExport: string | null = null) {
    const promise = import(path);
    if (namedExport) {
        return promise.then((module) => module[namedExport]);
    }

    return promise;
}
