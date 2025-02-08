
import { ImageLib, RGBAPixelMap } from "../image-lib";
import { Color, ColorRGB } from "../PixelMap";
import { mapRange } from "../utility/util";
import { save, load } from "./util";

function makeTransparent(img: RGBAPixelMap, colorToHide: ColorRGB, threshold1 = 20, threshold2 = 50) {
    img.filter((c: Color) => {
        const dr = c[0] - colorToHide[0];
        const dg = c[1] - colorToHide[1];
        const db = c[2] - colorToHide[2];
        const distanceSquared = dr * dr + dg * dg + db * db;
        const distance = Math.sqrt(distanceSquared);
        const f = mapRange(distance, threshold1, threshold2, 0, 1, true);
        c[3] *= f;
        return c;
    });
}

require.main === module && load('result').then(map => {
    map.filter((c: Color) => { c[3] = 255; return c; })
    makeTransparent(map, [0, 0, 0], 10, 100);
    save(map, "filtered");
})
