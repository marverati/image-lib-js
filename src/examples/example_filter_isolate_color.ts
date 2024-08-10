
import { ImageLib } from "../image-lib";
import { Color } from "../PixelMap";
import { getHueDiff, hslaToRgba, rgbaToHsla } from "../utility/HSL";
import { Interpolators } from "../utility/interpolation";
import { clamp } from "../utility/util";
import { save, load } from "./util";

const selectedHue = 0;
const hueTolerance = 45;

require.main === module && load('result').then(map => {
    const result = ImageLib.filter(map, (c: Color) => {
        const hsl = rgbaToHsla(c);
        const diff = getHueDiff(hsl[0], selectedHue);
        const saturationFactor = Interpolators.cubic(clamp(1 - diff / hueTolerance, 0, 1));
        hsl[1] *= saturationFactor;
        return hslaToRgba(hsl);
    });
    save(result, "filtered");
})
