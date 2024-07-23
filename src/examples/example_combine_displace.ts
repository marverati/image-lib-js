
import { ImageLib, RGBAPixelMap } from "../image-lib";
import { save, load } from "./util";

export function displace(map1: RGBAPixelMap, map2: RGBAPixelMap, amplitudeX: number, amplitudeY = amplitudeX, xChannel = 0, yChannel = 1): RGBAPixelMap {
    const factorX = amplitudeX / 127.5;
    const factorY = amplitudeY / 127.5;
    const result = ImageLib.combine(map1, map2, (a, b, x, y) => {
        return map1.get(x + (b[xChannel] - 127.5) * factorX, y + (b[yChannel] - 127.5) * factorY);
    });
    return result as RGBAPixelMap;
}

require.main === module && (async () => {
    const map1 = await load('result');
    const map2 = await load('filtered');
    const combined = displace(map1, map2, 50);
    save(combined, "combined");
})();
