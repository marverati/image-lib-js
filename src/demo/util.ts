
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function exposeToWindow(obj: Record<string, Object>) {
    for (const name of Object.keys(obj)) {
        window[name] = obj[name];
    }
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