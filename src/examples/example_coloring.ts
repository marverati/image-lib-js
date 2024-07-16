import { ImageLib } from "../image-lib";
import ColorGradient from "../utility/ColorGradient";
import { Interpolators } from "../utility/interpolation";
import { show } from "./util";

// Color Gradient
const gradient = ColorGradient.uniform([
    [0, 0, 0, 0],
    [255, 0, 0],
    [255, 255, 0],
    [255, 255, 255],
], Interpolators.stochastic, "mirror");

// Show preview
const gradientPreview = gradient.createPreview(512, 64, -0.5, 1.5);
show(gradientPreview, "gradient");

// Create image based on gradient
const map = ImageLib.generate((x, y) => gradient.get(0.5 + 0.5 * Math.sin(x / 50) * Math.sin(y / 50)), 512, 512);
show(map);