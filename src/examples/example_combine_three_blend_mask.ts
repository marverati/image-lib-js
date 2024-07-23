
import { GrayscalePixelMap, ImageLib, RGBAPixelMap } from "../image-lib";
import { blendColors } from "../utility/util";
import { save, load } from "./util";

export function blendMask(map1: RGBAPixelMap, map2: RGBAPixelMap, blendMap: GrayscalePixelMap): RGBAPixelMap {
    const fx = (blendMap.width - 1) / (map1.width - 1);
    const fy = (blendMap.height - 1) / (map1.height - 1);
    const result = ImageLib.combine(map1, map2, (a, b, x, y) => {
        const bx = x * fy, by = y * fx;
        return blendColors(a, b, blendMap.get(bx, by) / 255);
    });
    return result as RGBAPixelMap;
}

require.main === module && (async () => {
    const map1 = await load('result');
    const map2 = await load('filtered');
    const map3 = (await load('sphere')).extractR();
    const combined = blendMask(map1, map2, map3);
    save(combined, "combined");
})();
