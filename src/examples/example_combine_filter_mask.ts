
import { GrayscalePixelMap, ImageLib, RGBAPixelMap } from "../image-lib";
import { save, load } from "./util";

export function filterMask(map1: RGBAPixelMap, map2: GrayscalePixelMap): RGBAPixelMap {
    const result = ImageLib.combine(map1, map2, (a, b) => {
        return [
            a[0],
            a[1],
            a[2],
            a[3] * b / 255,
        ];
    });
    return result as RGBAPixelMap;
}

require.main === module && (async () => {
    const map1 = await load('result');
    const map2 = (await load('filtered')).extractR();
    const combined = filterMask(map1, map2);
    save(combined, "combined");
})();
