
import { ImageLib } from "../image-lib";
import { save } from "./util";

const ITERATIONS = 256;

const map = ImageLib.generate((x, y) => {
    const cr = (x - 256) / 128;
    const ci = (y - 256) / 128;
    let zr = 0;
    let zi = 0;
    let i = 0;
    for (; i < 256; i++) {
        const zr1 = zr * zr - zi * zi + cr;
        const zi1 = 2 * zr * zi + ci;
        zr = zr1;
        zi = zi1;
        if (zr * zr + zi * zi > 4) {
            break;
        }
    }
    return i >= 256 ? 0 : i;
}, 512, 512);
save(map);