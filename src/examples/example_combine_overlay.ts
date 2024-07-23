
import { ImageLib, RGBAPixelMap } from "../image-lib";
import { blendColors } from "../utility/util";
import { save, load } from "./util";

export function overlay(map1: RGBAPixelMap, map2: RGBAPixelMap): RGBAPixelMap {
    const max = 3 * 127.5;
    const result = ImageLib.combine(map1, map2, (a, b) => {
        const f = (Math.abs(b[0] - 127.5) + Math.abs(b[1] - 127.5) + Math.abs(b[2] - 127.5)) / max;
        return blendColors(a, b, f);
    });
    return result as RGBAPixelMap;
}

require.main === module && (async () => {
    const map1 = await load('result');
    const map2 = await load('sphere');
    const combined = overlay(map1, map2);
    save(combined, "combined");
})();
