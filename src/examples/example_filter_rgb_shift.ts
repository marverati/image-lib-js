
import { ImageLib } from "../image-lib";
import { Color } from "../PixelMap";
import { show, load } from "./util";


load('output/result.png').then(map => {
    const result = ImageLib.filter(map, (c: Color, x, y) => [c[0], map.get(x - 3, y + 1)[1], map.get(x - 2, y + 4)[2], c[3]]);
    show(result, "filtered");
})
