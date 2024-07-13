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