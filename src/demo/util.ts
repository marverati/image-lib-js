
export function exposeToWindow(obj: Record<string, Object>) {
    for (const name of Object.keys(obj)) {
        window[name] = obj[name];
    }
}
