import { Color, ColorRGB } from "../PixelMap";
import { absMod } from "./util";

export type ColorHSL = [number, number, number];
export type ColorHSLA = [number, number, number, number];

export function rgbToHsl(rgb: ColorRGB): ColorHSL {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }

        h /= 6;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function rgbaToHsla(rgba: Color): ColorHSLA {
    const hsl = rgbToHsl(rgba as number[] as ColorRGB);
    hsl.push(rgba[3]);
    return hsl as number[] as ColorHSLA;
}

// Convert HSL/HSLA to RGB/RGBA
export function hslToRgb(hsl: ColorHSL): ColorRGB {
    const h = absMod(hsl[0], 360) / 360;
    const s = hsl[1] / 100;
    const l = hsl[2] / 100;

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function hslaToRgba(hsla: ColorHSLA): Color {
    const rgba = hslToRgb(hsla.slice(0, 3) as number[] as ColorHSL);
    rgba.push(Math.round(hsla[3]));
    return rgba as number[] as Color;
}

export function getHueDiff(hue1: number, hue2: number): number {
    const diff = Math.abs(hue1 - hue2) % 360;
    return Math.min(diff, 360 - diff);
}