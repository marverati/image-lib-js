
import { ImageLib } from "../image-lib";
import { Color } from "../PixelMap";
import { hslaToRgba, rgbaToHsla } from "../utility/HSL";
import { save, load } from "./util";

require.main === module && load('result').then(map => {
    const result = ImageLib.filter(map, (c: Color) => {
        const hsl = rgbaToHsla(c);
        hsl[2] = 100 - hsl[2];
        return hslaToRgba(hsl);
    });
    save(result, "filtered");
})
