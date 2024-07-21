
import { ImageLib } from "../image-lib";
import { Color } from "../PixelMap";
import { show, load } from "./util";


require.main === module && load('output/result.png').then(map => {
    const colorToOffset = (v: number) => 50 * (v - 127.5) / 127.5
    const result = ImageLib.filter(map, (c: Color, x, y) => map.get(x + colorToOffset(c[0]), y + colorToOffset(c[1])));
    show(result, "filtered");
})
