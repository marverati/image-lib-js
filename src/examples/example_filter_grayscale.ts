
import { GrayscalePixelMap, ImageLib } from "../image-lib";
import { Color } from "../PixelMap";
import { save, load } from "./util";

const fr = 0.25;
const fg = 0.64;
const fb = 0.11;

require.main === module && load('result').then(map => {
    const result = ImageLib.filter(map, (c: Color) => fr * c[0] + fg * c[1] + fb * c[2]);
    save(result, "filtered");
})
