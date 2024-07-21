
import { ImageLib, RGBAPixelMap } from "../image-lib";
import { blur } from "./example_filter_blur";
import { show, load } from "./util";

export function bloom(map: RGBAPixelMap, dx: number, dy = dx, blurStrength = 1): RGBAPixelMap {
    const blurred = blur(map, dx, dy);
    const result = ImageLib.filter(map, (c, x, y) => {
        const blurredPixel = blurred.getFast(x, y);
        return [
            Math.max(c[0], blurredPixel[0] * blurStrength),
            Math.max(c[1], blurredPixel[1] * blurStrength),
            Math.max(c[2], blurredPixel[2] * blurStrength),
            c[3],
        ];
    });
    return result;
}

load('output/result.png').then(map => {
    const filterResult = bloom(map, 20, 20, 0.85);
    show(filterResult, "filtered");
})
