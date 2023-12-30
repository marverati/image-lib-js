
export function exposeToWindow(obj: Record<string, Object>) {
    for (const name of Object.keys(obj)) {
        window[name] = obj[name];
    }
}

export function mapRange(v: number, fromMin: number, fromMax: number, toMin: number, toMax: number, clampResult = false): number {
    const result = toMin + (v - fromMin) / (fromMax - fromMin) * (toMax - toMin);
    return clampResult ? clamp(result, toMin, toMax) : result;
}

export function getRangeMapper(fromMin: number, fromMax: number, toMin: number, toMax: number, clampResult = false): (v: number) => number {
    const f = (fromMax - fromMin) * (toMax - toMin);
    const toSpan = toMax - toMin;
    if (clampResult) {
        return (v: number) => toMin + clamp((v - fromMin) * f, 0, toSpan);
    } else {
        return (v: number) => toMin + (v - fromMin) * f;
    }
}

export function clamp(v: number, min: number, max: number): number {
    return v < min ? min : v > max ? max : v;
}

const allowedCharacters = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,-_+:`
export function removeNonStandardCharacters(s: string): string {
    let result = '';
    for (const c of s) {
        if (allowedCharacters.includes(c)) {
            result += c;
        }
    }
    return result;
}