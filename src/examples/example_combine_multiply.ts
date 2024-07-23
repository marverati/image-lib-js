
import { ImageLib, RGBAPixelMap } from "../image-lib";
import { save, load } from "./util";

export function multiply(map1: RGBAPixelMap, map2: RGBAPixelMap): RGBAPixelMap {
    const result = ImageLib.combine(map1, map2, (a, b) => {
        return [
            a[0] * b[0] / 255,
            a[1] * b[1] / 255,
            a[2] * b[2] / 255,
            a[3] * b[3] / 255,
        ];
    });
    return result as RGBAPixelMap;
}

require.main === module && (async () => {
    const map1 = await load('result');
    const map2 = await load('filtered');
    const combined = multiply(map1, map2);
    save(combined, "combined");
})();
