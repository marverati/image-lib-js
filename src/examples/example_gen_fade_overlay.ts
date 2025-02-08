
import { ImageLib } from "../image-lib";
import { Interpolators } from "../utility/interpolation";
import { save } from "./util";

const size = 1024;

const map = ImageLib.generate((x, y) => {
    const fy = 2 * y / size;
    const f = fy > 1 ? 2 - fy : fy;
    const i = Interpolators.cubic(f);
    const alpha = 160 - 160 * i;
    return [255, 255, 255, alpha];
}, size, size);
save(map);