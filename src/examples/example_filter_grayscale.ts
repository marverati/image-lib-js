
import { GrayscalePixelMap, ImageLib, RGBAPixelMap } from "../image-lib";
import { Color } from "../PixelMap";
import { save, load } from "./util";

const default_fr = 0.25;
const default_fg = 0.64;
const default_fb = 0.11;

export function filterGrayscale(
    map: RGBAPixelMap,
    fr: number = default_fr,
    fg: number = default_fg,
    fb: number = default_fb
): GrayscalePixelMap {
    return ImageLib.filter(map, (c: Color) => fr * c[0] + fg * c[1] + fb * c[2]);
}

require.main === module && load('result').then(map => {
    const result = filterGrayscale(map, default_fr, default_fg, default_fb);
    save(result, "filtered");
})
