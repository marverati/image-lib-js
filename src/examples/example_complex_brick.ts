
import { ImageLib } from "../image-lib";
import ColorGradient from "../utility/ColorGradient";
import { fractalPerlin2D, perlin2D } from "../utility/perlin";
import { overlay } from "./example_combine_overlay";
import { blur, blurGrayscale } from "./example_filter_blur";
import { getLightOverlay } from "./example_filter_lighting";
import { filter_powerFromMiddle } from "./example_filter_power_from_middle";
import { genBrick } from "./example_gen_brick";
import { save } from "./util";

// Rusty metal color gradient
const colorGradient = ColorGradient.uniform([
    [104, 104, 104],
    [104, 104, 104],
    [119, 119, 119],
    [174, 68, 65],
    [165, 48, 44],
]);

export function genBrickTexture() {
    const brickBase = genBrick(48, 24, 3);
    const brick = blurGrayscale(brickBase, 6);
    const indent = ImageLib.generate((x, y) => fractalPerlin2D(x / 18, y / 10, 4, 2, 0.6) * 255);
    const weakIndent = filter_powerFromMiddle(indent, 1.5);
    brick.filter((v, x, y) => v + (weakIndent.get(x, y) - 127.5) * 0.6);
    // Base coloring
    const color = ImageLib.filter(brick, (c) => colorGradient.get(c / 255));
    // Lighting
    const light = getLightOverlay(brick, 0.8, -1.6, 1, 0.7, 0.5, 16);
    // Combine and return
    const result = overlay(color, light.toRGBA());
    return result;
}

const map = genBrickTexture();
save(map);