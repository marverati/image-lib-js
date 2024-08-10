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