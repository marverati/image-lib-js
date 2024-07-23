
import { ImageLib } from "../image-lib";
import { Color } from "../PixelMap";
import { save, load } from "./util";


require.main === module && load('result').then(map => {
    const overload = (v: number) => 127.5 - 127.5 * Math.cos(6 * Math.PI * v / 255.0);
    const result = ImageLib.filter(map, (c: Color, x, y) => [overload(c[0]), overload(c[1]), overload(c[2]), c[3]]);
    save(result, "filtered");
})
