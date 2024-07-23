
import { ImageLib, RGBAPixelMap } from "../image-lib";
import { save, load } from "./util";

require.main === module && (async () => {
    const map1 = await load('result');
    const map2 = await load('filtered');
    const combined = ImageLib.combine(map1, map2, (a, b) => {
        return [
            Math.max(a[0], b[0]),
            Math.max(a[1], b[1]),
            Math.max(a[2], b[2]),
            Math.max(a[3], b[3]),
        ];
    });
    save(combined, "combined");
})();
