
import { ImageLib } from "../../image-lib";
import { save } from "../util";

const size = 2048;

const r = 0, g = 0, b = 0;

const map = ImageLib.generate((x, y) => {
    const rely = y / size;
    const f = Math.cos(rely * Math.PI * 2) * 0.5 + 0.5;
    return [r, g, b, 255 * f];
}, size, size);
save(map, "project");