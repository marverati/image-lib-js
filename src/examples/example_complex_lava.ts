
import { ImageLib } from "../image-lib";
import ColorGradient from "../utility/ColorGradient";
import { fractalPerlin2D, perlin2D } from "../utility/perlin";
import { overlay } from "./example_combine_overlay";
import { getLightOverlay } from "./example_filter_lighting";
import { filter_powerFromMiddle } from "./example_filter_power_from_middle";
import { save } from "./util";

const colorGradient = ColorGradient.uniform([
    [255, 165, 20],
    [250, 30, 3],
    [80, 64, 64],
    [60, 60, 60],
    [50, 50, 50],
    [50, 50, 50],
]);

export function genLava(offsetFactor = 5, offsetAngleFactor = Math.PI * 2) {
    offsetFactor /= 127.5;
    offsetAngleFactor /= 127.5;
    const baseHeight = ImageLib.generate((x, y) => fractalPerlin2D(x / 64, y / 64, 7, 2, 0.5) * 255);
    const offsetX = ImageLib.generate((x, y) => perlin2D(x / 32, y / 32) * 255);
    const offsetY = ImageLib.generate((x, y) => perlin2D(9999 + x / 32, y / 32) * 255);
    const height = baseHeight.filter((c, x, y) => {
        // return baseHeight.get(
        //     x + (offsetX.get(x, y) - 127.5) * offsetFactor,
        //     y + (offsetY.get(x, y) - 127.5) * offsetFactor
        // );
        const angle = (offsetX.get(x, y) - 127.5) * offsetAngleFactor;
        const distance = (offsetY.get(x, y) - 127.5) * offsetFactor;
        return baseHeight.get(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance);
    });
    const height2 = filter_powerFromMiddle(height, 0.8);
    // Base coloring
    const color = ImageLib.filter(height2, (c) => colorGradient.get(c / 255));
    // Lighting
    const light = getLightOverlay(height2, 2, 2, 1, 0.7, 0.5, 16);
    // Combine and return
    const result = overlay(color, light.toRGBA());
    return result;
}

const map = genLava();
save(map);