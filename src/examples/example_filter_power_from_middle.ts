
import { GrayscalePixelMap, ImageLib, RGBAPixelMap } from "../image-lib";
import { Color } from "../PixelMap";
import { filterGrayscale } from "./example_filter_grayscale";
import { save, load } from "./util";

const default_fr = 0.25;
const default_fg = 0.64;
const default_fb = 0.11;

export function filter_powerFromMiddle(
    map: GrayscalePixelMap,
    power: number,
): GrayscalePixelMap {
    const middle = 127.5;
    return ImageLib.filter(map, (c: number) => {
        const relative = (c - middle) / middle;
        if (relative < 0) {
            return middle - Math.pow(-relative, power) * middle;
        } else {
            return middle + Math.pow(relative, power) * middle;
        }
    });
}

require.main === module && load('result').then(map => {
    const result = filter_powerFromMiddle(filterGrayscale(map), 0.5);
    save(result, "filtered");
})
