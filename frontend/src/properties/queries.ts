import type { TProperty } from "./type";

export async function getProperties(): Promise<TProperty[]> {
    const response = await fetch("/api/propiedades/destacadas");
    let props: TProperty[];
    try {
        const data = await response.json();
        props = data.properties;
    } catch (e) {
        console.error(e);
        props = [];
    }
    return props;
}
