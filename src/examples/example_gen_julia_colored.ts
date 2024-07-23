
import { ImageLib } from "../image-lib";
import ColorGradient from "../utility/ColorGradient";
import { Interpolators } from "../utility/interpolation";
import { save } from "./util";

const ITERATIONS = 256;

const gradient = ColorGradient.uniform([
    [0, 0, 0],
    [255, 0, 0],
    [255, 255, 0],
    [0, 255, 0],
    [0, 255, 255],
    [0, 0, 255],
    [128, 0, 255],
    [255, 0, 0],
], Interpolators.linear, "mirror");

// Julia set fractal
const map = ImageLib.generate((x, y) => {
    const cr = 0.357;
    const ci = 0.351;
    let zr = (x - 256) / 180;
    let zi = (y - 256) / 180;
    let i = 0;
    for (; i < ITERATIONS; i++) {
        const zr1 = zr * zr - zi * zi + cr;
        const zi1 = 2 * zr * zi + ci;
        zr = zr1;
        zi = zi1;
        if (zr * zr + zi * zi > 4) {
            break;
        }
    }
    const c = i >= ITERATIONS ? 0 : i / ITERATIONS;
    return gradient.get(c);
}, 512, 512);
save(map);