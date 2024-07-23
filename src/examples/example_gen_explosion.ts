
import { clamp, mapRange } from "../demo/util";
import { ImageLib } from "../image-lib";
import ColorGradient from "../utility/ColorGradient";
import { Interpolators } from "../utility/interpolation";
import { fractalPerlin2D, perlin2D } from "../utility/perlin";
import { save } from "./util";

ImageLib.setDefaultSize(512, 512);

// Color Gradient
const gradient = ColorGradient.uniform([
    [0, 0, 0, 0],
    [75, 40, 0, 180],
    [255, 230, 90, 210],
    [255, 255, 255, 255],
], Interpolators.cubic, "clamp");


const fadeMap = ImageLib.generateRadial((angle, distance) => mapRange(Interpolators.sin(clamp(distance / 250, 0, 1)), 0, 1, 255, 0));

const noiseMap = ImageLib.generate((x, y) => fractalPerlin2D(x / 64, y / 64, 7, 2, 0.6) * 255, 512, 512);

const map = ImageLib.generate((x, y) => {
    const fade = 2 * fadeMap.get(x, y) / 255;
    const noise = noiseMap.get(x, y) / 255;
    return gradient.get(fade * noise);
})

save(map);