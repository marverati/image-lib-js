
import { absMod } from "../demo/util";
import { ImageLib } from "../image-lib";
import { Color } from "../PixelMap";
import { show, load } from "./util";

const ANGLE_PARTS = 16;
const tau = 2 * Math.PI;

require.main === module && load('output/result.png').then(map => {

    map.setWrapMode("mirror");

    const midx = (map.width - 1) / 2;
    const midy = (map.height - 1) / 2;
    const result = ImageLib.filter(map, (c: Color, x, y) => {
        const dx = x - midx, dy = y - midy;
        const dis = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dx, dy);
        const fixedAngle = (absMod(angle * ANGLE_PARTS, tau) % tau) / ANGLE_PARTS;
        const nx = midx + dis * Math.sin(fixedAngle);
        const ny = midy + dis * Math.cos(fixedAngle);
        return map.get(nx, ny);
    });
    show(result, "filtered");
});
