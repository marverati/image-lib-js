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