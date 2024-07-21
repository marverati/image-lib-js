
import { ImageLib } from "../image-lib";
import { Color } from "../PixelMap";
import { show, load } from "./util";


require.main === module && load('output/result.png').then(map => {
    const result = ImageLib.filter(map, (c: Color, x, y) => map.get(x, y + 20 * Math.sin(x / 80)));
    show(result, "filtered");
});
