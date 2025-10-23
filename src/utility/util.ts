import { Color, ColorRGB } from "../PixelMap";


export function blendColors(a: Color | ColorRGB, b: Color | ColorRGB, t: number): Color {
    const alphaA = (a[3] ?? 255) * (1 - t), alphaB = (b[3] ?? 255) * t;
    const sum = alphaA + alphaB;
    const ct = sum < 1 ? 0 : alphaB / sum;
    return [
        a[0] + (b[0] - a[0]) * ct,
        a[1] + (b[1] - a[1]) * ct,
        a[2] + (b[2] - a[2]) * ct,
        alphaA + alphaB,
    ];
}

export function averageColors(colors: (Color | ColorRGB)[]): Color {
    const result: Color = [0, 0, 0, 0];
    for (const color of colors) {
        result[0] += color[0];
        result[1] += color[1];
        result[2] += color[2];
        result[3] += color[3] ?? 255;
    }
    const n = colors.length;
    result[0] /= n;
    result[1] /= n;
    result[2] /= n;
    result[3] /= n;
    return result;
}

export function colorFromString(color: string): Color | ColorRGB {
    if (color.startsWith('#')) {
        const hex = parseInt(color.slice(1), 16);
        if (color.length === 9) {
            return [(hex >> 24) & 0xFF, (hex >> 16) & 0xFF, (hex >> 8) & 0xFF, hex & 0xFF];
        } else {
            return [(hex >> 16) & 0xFF, (hex >> 8) & 0xFF, hex & 0xFF, 255];
        }
    } else {
        throw new Error('Unsupported color format');
    }
}

export function colorToString(color: Color | ColorRGB | string): string {
    if (typeof color === "string") {
        return color;
    }
    if (color.length === 4) {
        // Use >>> 0 to treat the result of the shift as an unsigned 32-bit integer
        const red = (color[0] << 24) >>> 0; // avoid weird negative numbers
        const gba = (color[1] << 16) | (color[2] << 8) | color[3];
        // Combine alpha and RGB, ensuring the result is treated as unsigned
        const combined = (red + gba) >>> 0;
        return `#${combined.toString(16).padStart(8, '0')}`;
    } else {
        return `#${((color[0] << 16) | (color[1] << 8) | color[2]).toString(16).padStart(6, '0')}`;
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
    const f = (toMax - toMin) / (fromMax - fromMin);
    const toSpan = toMax - toMin;
    if (clampResult) {
        if (toMin < toMax) {
            return (v: number) => toMin + clamp((v - fromMin) * f, 0, toSpan);
        } else {
            return (v: number) => toMin + clamp((v - fromMin) * f, toSpan, 0);
        }
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

export function mirrorOutsideRange(v: number, min: number, max: number): number {
    const fullRange = 2 * (max - min);
    const value = min + absMod(v - min, fullRange);
    if (value < max) {
        return value;
    } else {
        return 2 * max - value;
    }
}

export function debounce(func: (...args: any[]) => void, delay: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return function(this: any, ...args: any[]) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

export function capAtDecimals(v: number, decimals: number): string {
    const currentDecimals = v.toString().split('.')[1]?.length || 0;
    if (currentDecimals > decimals) {
        return v.toFixed(decimals);
    } else {
        return v.toString();
    }
}

/**
 * Takes a value that may exceed the min/max range and eases it into the range using a sigmoid function.
 * With a sigmoidScale of 1, the original full range will be map to roughly 0.27 to 0.73 in the eased range.
 * Other sigmoidScale values:
 * 2 -> 0.12 to 0.88
 * 3 -> 0.05 to 0.95
 * 5 -> 0.007 to 0.993 (very steep, in most cases lower scale values are preferred)
 * The further the value moves outside the original range, the closer the eased value will get to the min or max,
 * but it will never actually reach it.
 * @param v 
 * @param min 
 * @param max 
 * @param sigmoidScale 
 * @returns 
 */
export function easeContinuous(v: number, min: number, max: number, sigmoidScale: number): number {
    const rel = (v - min) / (max - min);
    const eased = sigmoid((rel - 0.5) * sigmoidScale * 2);
    return min + eased * (max - min);
}

export function sigmoid(v: number): number {
    return 1 / (1 + Math.exp(-v));
}