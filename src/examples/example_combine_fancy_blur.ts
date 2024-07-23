
import { ImageLib, RGBAPixelMap } from "../image-lib";
import { averageColors, blendColors } from "../utility/util";
import { save, load } from "./util";

export function fancyBlur(map1: RGBAPixelMap, map2: RGBAPixelMap, maxDis: number, channel1 = 0, channel2 = 1): RGBAPixelMap {
    const factor = maxDis / 255;
    const result = ImageLib.combine(map1, map2, (a, b, x, y) => {
        const dis1 = b[channel1] * factor;
        const dis2 = b[channel2] * factor;
        const colors = [a];
        // First diagonal
        for (let i = 1; i < dis1; i++) {
            colors.push(map1.get(x + i, y + i));
            colors.push(map1.get(x - i, y - i));
        }
        // Second diagonal
        for (let i = 1; i < dis2; i++) {
            colors.push(map1.get(x + i, y - i));
            colors.push(map1.get(x - i, y + i));
        }
        return averageColors(colors);
    });
    return result as RGBAPixelMap;
}

require.main === module && (async () => {
    const map1 = await load('result');
    const map2 = await load('filtered');
    const combined = fancyBlur(map1, map2, 20);
    save(combined, "combined");
})();
