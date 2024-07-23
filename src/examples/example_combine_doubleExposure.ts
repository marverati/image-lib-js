
import { ImageLib, RGBAPixelMap } from "../image-lib";
import { blendColors } from "../utility/util";
import { save, load } from "./util";

export function doubleExposure(map1: RGBAPixelMap, map2: RGBAPixelMap, inverted = false): RGBAPixelMap {
    const result = ImageLib.combine(map1, map2, (a, b) => {
        const h = (a[0] + a[1] + a[2]) / 3;
        const f = inverted ? h / 255 : 1 - h / 255;
        return blendColors(a, b, f);
    });
    return result;
}

require.main === module && (async () => {
    const map1 = await load('sphere');
    const map2 = await load('result');
    const combined = doubleExposure(map1, map2, true);
    save(combined, "combined");
})();
