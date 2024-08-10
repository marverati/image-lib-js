
import { ImageLib, RGBAPixelMap } from "../image-lib";
import { genColorfulTrig } from "./example_gen_colorful_trig";
import { save, load } from "./util";

export function displaceAngular(map1: RGBAPixelMap, map2: RGBAPixelMap, factorDis: number, factorAngle: number, disChannel = 0, angleChannel = 1): RGBAPixelMap {
    factorDis /= 127.5;
    factorAngle /= 127.5;
    const result = ImageLib.combine(map1, map2, (a, b, x, y) => {
        const angle = (b[angleChannel] - 127.5) * factorAngle;
        const distance = (b[disChannel] - 127.5) * factorDis;
        return map1.get(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance);
    });
    return result as RGBAPixelMap;
}

require.main === module && (async () => {
    const map1 = await load('result');
    const map2 = genColorfulTrig();
    const combined = displaceAngular(map1, map2, 30, Math.PI * 2);
    save(combined, "combined");
})();
