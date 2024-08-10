
import { ImageLib } from "../image-lib";
import { Color } from "../PixelMap";
import { hslaToRgba, rgbaToHsla } from "../utility/HSL";
import { save, load } from "./util";

const colorShift = 120;

require.main === module && load('result').then(map => {
    const result = ImageLib.filter(map, (c: Color) => {
        const hsl = rgbaToHsla(c);
        hsl[0] += colorShift;
        return hslaToRgba(hsl);
    });
    save(result, "filtered");
})
