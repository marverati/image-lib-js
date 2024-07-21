
import { ImageLib } from "../image-lib";
import { Color } from "../PixelMap";
import { show, load } from "./util";


require.main === module && load('output/result.png').then(map => {
    const result = ImageLib.filter(map, (c: Color) => [255 - c[0], 255 - c[1], 255 - c[2], c[3]]);
    show(result, "filtered");
})
