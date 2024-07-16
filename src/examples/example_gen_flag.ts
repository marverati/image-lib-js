
import { ImageLib } from "../image-lib";
import ColorGradient from "../utility/ColorGradient";
import { Interpolators } from "../utility/interpolation";
import { show } from "./util";

const waveXAmp = 0;
const waveXFreq = 1 / 180;
const waveYAmp = 12;
const waveYFreq = 1 / 180;

const width = 512;
const height = 512;

const x1 = 20;
const y1 = 80;
const x2 = width - x1;
const y2 = height - y1;

const colors = ColorGradient.uniform([
    [255, 0, 0],
    [255, 255, 255],
    [0, 0, 255],
    [0, 0, 255], // duplicate last color so floor interpolation works correctly
], Interpolators.floor);

const map = ImageLib.generate((x, y) => {
    x = x + waveXAmp * Math.sin(2 * Math.PI * waveXFreq * y);
    y = y + waveYAmp * Math.sin(2 * Math.PI * waveYFreq * x);
    if (x < x1 || x > x2 || y < y1 || y > y2) {
        return [0, 0, 0, 0];
    }
    return colors.get((y - y1) / (y2 - y1));
}, 512, 512);
show(map);