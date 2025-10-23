import { Color } from "../image-lib";
import ColorGradient from "./ColorGradient";
import { Random } from "./Random";
import { absMod, clamp, easeContinuous } from "./util";

type ColorStep = {
    position: number;
    r: number;
    g: number;
    b: number;
}

export function createAutoColorGradient(
    stepSize = 0.2,
    colorDiff = 0.4,
    wrapAt = 1000,
    startColor: [number, number, number] | null = [0, 0, 0],
    seed = Date.now(),
    uniformSteps = false,
): ColorGradient {
    const rnd = new Random(seed);
    let position = 0;
    // Initialize first color
    const colors: ColorStep[] = [{
        position,
        r: startColor ? startColor[0] : rnd.uniform(0, 255),
        g: startColor ? startColor[1] : rnd.uniform(0, 255),
        b: startColor ? startColor[2] : rnd.uniform(0, 255),
    }];
    // Add all remaining colors
    while (position < wrapAt) {
        if (uniformSteps) {
            position += stepSize;
        } else {
            position += rnd.logGaussian(0, 1) * stepSize;
        }
        const lastColor = colors[colors.length - 1];
        const newR = clamp(lastColor.r, 0, 255) + rnd.gaussian(0, 1) * colorDiff * 255;
        const newG = clamp(lastColor.g, 0, 255) + rnd.gaussian(0, 1) * colorDiff * 255;
        const newB = clamp(lastColor.b, 0, 255) + rnd.gaussian(0, 1) * colorDiff * 255;
        colors.push({ position, r: newR, g: newG, b: newB });
    }
    colors.at(-1)!.position = wrapAt; // ensure last color is exactly at wrapAt

    const colorFunc = (value: number): Color => {
        // Self wrap
        value = absMod(value, wrapAt);
        // Find the two colors to interpolate between, using binary search
        let lowerIndex = 0;
        let upperIndex = colors.length - 1;
        while (lowerIndex < upperIndex) {
            const midIndex = Math.floor((lowerIndex + upperIndex) / 2);
            if (colors[midIndex].position < value) {
                lowerIndex = midIndex + 1;
            } else {
                upperIndex = midIndex;
            }
        }
        const upperColor = colors[lowerIndex];
        const lowerColor = colors[lowerIndex - 1] ?? upperColor;
        const lowererColor = colors[lowerIndex - 2] ?? lowerColor;
        const uppererColor = colors[lowerIndex + 1] ?? upperColor;
        const tDiff = value - lowerColor.position;
        const tSpan = upperColor.position - lowerColor.position;
        const t = tSpan === 0 ? 0 : tDiff / tSpan;
        // Spline-like interpolation using four points
        const t2 = t * t;
        const t3 = t2 * t;
        const r = 0.5 * ((2 * lowerColor.r) +
            (-lowererColor.r + upperColor.r) * t +
            (2 * lowererColor.r - 5 * lowerColor.r + 4 * upperColor.r - uppererColor.r) * t2 +
            (-lowererColor.r + 3 * lowerColor.r - 3 * upperColor.r + uppererColor.r) * t3);
        const g = 0.5 * ((2 * lowerColor.g) +
            (-lowererColor.g + upperColor.g) * t +
            (2 * lowererColor.g - 5 * lowerColor.g + 4 * upperColor.g - uppererColor.g) * t2 +
            (-lowererColor.g + 3 * lowerColor.g - 3 * upperColor.g + uppererColor.g) * t3);
        const b = 0.5 * ((2 * lowerColor.b) +
            (-lowererColor.b + upperColor.b) * t +
            (2 * lowererColor.b - 5 * lowerColor.b + 4 * upperColor.b - uppererColor.b) * t2 +
            (-lowererColor.b + 3 * lowerColor.b - 3 * upperColor.b + uppererColor.b) * t3);
        return [
            easeContinuous(r, 0, 255, 3),
            easeContinuous(g, 0, 255, 3),
            easeContinuous(b, 0, 255, 3),
            255
        ];
    }

    return new ColorGradient(colorFunc, "no-wrap"); // we're handling wrap ourselves
}