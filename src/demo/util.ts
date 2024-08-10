
export function exposeToWindow(obj: Record<string, Object>) {
    for (const name of Object.keys(obj)) {
        window[name] = obj[name];
    }
}

export function mapRange(v: number, fromMin: number, fromMax: number, toMin: number, toMax: number, clampResult = false): number {
    const result = toMin + (v - fromMin) / (fromMax - fromMin) * (toMax - toMin);
    if (clampResult) {
        if (toMin < toMax) {
            return clamp(result, toMin, toMax);
        } else {
            return clamp(result, toMax, toMin);
        }
    }
    return result;
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

export function absMod(v: number, m: number): number {
    return ((v % m) + m) % m;
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

export function createElement(tag: string, className = "", content?: string | HTMLElement[], parent?: HTMLElement): HTMLElement {
    const el = document.createElement(tag);
    if (className) {
        el.className = className;
    }
    if (content) {
        if (content instanceof Array) {
            // Child content
            content.forEach(child => el.appendChild(child));
        } else {
            // Text content
            el.textContent = content;
        }
    }
    if (parent) {
        parent.appendChild(el);
    }
    return el;
}

export function getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const parts = document.cookie.split(';');
    const part = parts.find(p => p.trim().startsWith(nameEQ));
    if (part) {
        return part.trim().substring(nameEQ.length);
    }
    return null;
}