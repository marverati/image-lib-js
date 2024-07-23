
import { ImageLib, RGBAPixelMap } from "../image-lib";
import { Color } from "../PixelMap";
import { boxBlur } from "./example_filter_box_blur";
import { save, load } from "./util";

export function blur(map: RGBAPixelMap, dx: number, dy = dx): RGBAPixelMap {
    const once = boxBlur(map, dx, dy);
    const twice = boxBlur(once, dx, dy);
    return twice;
}

require.main === module && load('result').then(map => {
    const result = blur(map, 20);
    save(result, "filtered");
});
