
import { ImageLib } from "../image-lib";
import { Color } from "../PixelMap";
import { save, load } from "./util";


require.main === module && load('result').then(map => {
    const result = ImageLib.filter(map, (c: Color, x, y) => [c[0], map.get(x - 3, y + 1)[1], map.get(x - 2, y + 4)[2], c[3]]);
    save(result, "filtered");
})
