
import { ImageLib } from "../image-lib";
import ColorGradient from "../utility/ColorGradient";
import { fractalPerlin2D, perlin2D } from "../utility/perlin";
import { overlay } from "./example_combine_overlay";
import { getLightOverlay } from "./example_filter_lighting";
import { filter_powerFromMiddle } from "./example_filter_power_from_middle";
import { save } from "./util";

// Rusty metal color gradient
const colorGradient = ColorGradient.uniform([
    [192, 46, 4],
    [138, 56, 12],
    [116, 116, 116],
    [94, 94, 94],
]);

export function genRust(offsetFactor = 5, offsetAngleFactor = Math.PI * 2) {
    offsetFactor /= 127.5;
    offsetAngleFactor /= 127.5;
    const baseHeight = ImageLib.generate((x, y) => fractalPerlin2D(x / 64, y / 64, 7, 2, 0.6) * 255);
    baseHeight.filterBuffered((h, x, y) => {
        return baseHeight.get(x, y + h * 0.12);
    });
    // Base coloring
    const color = ImageLib.filter(baseHeight, (c) => colorGradient.get(c / 255));
    // Lighting
    const light = getLightOverlay(baseHeight, 0.2, 1.2, 1, 0.7, 0.5, 16);
    // Combine and return
    const result = overlay(color, light.toRGBA());
    return result;
}

const map = genRust();
save(map);