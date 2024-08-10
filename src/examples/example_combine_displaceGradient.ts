
import { mapRange } from "../utility/util";
import { ImageLib, RGBAPixelMap } from "../image-lib";
import { save, load, loadOrGenerate } from "./util";

export function displaceGradient(map1: RGBAPixelMap, map2: RGBAPixelMap, amplitudeX: number, amplitudeY = amplitudeX, xChannel = 0, yChannel = 1): RGBAPixelMap {
    const factorX = amplitudeX / 127.5;
    const factorY = amplitudeY / 127.5;
    const result = ImageLib.combine(map1, map2, (a, b, x, y) => {
        const disX = map2.get(x + 1, y)[xChannel] - map2.get(x - 1, y)[xChannel];
        const disY = map2.get(x, y + 1)[yChannel] - map2.get(x, y - 1)[yChannel];
        return map1.get(x + disX * factorX, y + disY * factorY);
    });
    return result as RGBAPixelMap;
}

require.main === module && (async () => {
    const map1 = await load('result');
    const r = Math.min(map1.width, map1.height) * 0.43 - 5;
    const map2 = await loadOrGenerate('sphere', () => ImageLib.generateRadial((angle, dis) => {
        const c = 255 * Math.sqrt(1 - mapRange(dis, 0, r, 0, 1, true) ** 2);
        return [c, c, c, 255];
    }, map1.width, map1.height));
    const combined = displaceGradient(map1, map2, 500);
    save(combined, "combined");
})();
