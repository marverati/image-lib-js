
import { ImageLib } from "../image-lib";
import { Color } from "../PixelMap";
import { save, load } from "./util";


require.main === module && load('result').then(map => {
    const result = ImageLib.filter(map, (c: Color, x, y) => map.get(x, y + 20 * Math.sin(x / 80)));
    save(result, "filtered");
});
