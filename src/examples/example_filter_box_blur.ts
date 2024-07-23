
import { ImageLib, RGBAPixelMap } from "../image-lib";
import { Color, PixelMap } from "../PixelMap";
import { save, load } from "./util";


export function boxBlur(map: RGBAPixelMap, dx: number, dy = dx): RGBAPixelMap {
    let sums: [number, number, number][][] = [[]];
    // Top left pixel
    sums[0][0] = map.get(0, 0).slice(0, 3) as [number, number, number];
    // Top row
    for (let x = 1; x < map.width; x++) {
        const prev = sums[0][x - 1];
        const current = map.get(x, 0);
        sums[0][x] = [ prev[0] + current[0], prev[1] + current[1], prev[2] + current[2] ];
    }
    // Left column
    for (let y = 1; y < map.height; y++) {
        const prev = sums[y - 1][0];
        const current = map.get(0, y);
        sums[y] = [];
        sums[y][0] = [ prev[0] + current[0], prev[1] + current[1], prev[2] + current[2] ];
    }
    // Rest
    for (let y = 1; y < map.height; y++) {
        for (let x = 1; x < map.width; x++) {
            const top = sums[y - 1][x];
            const left = sums[y][x - 1];
            const topleft = sums[y - 1][x - 1];
            const current = map.get(x, y);
            sums[y][x] = [
                top[0] + left[0] - topleft[0] + current[0],
                top[1] + left[1] - topleft[1] + current[1],
                top[2] + left[2] - topleft[2] + current[2],
            ];
        }
    }

    const offX = Math.floor(dx / 2);
    const offY = Math.floor(dy / 2);
    const offX2 = dx - offX;
    const offY2 = dy - offY;
    const blurMap = ImageLib.filter(map, (c: Color, x: number, y: number) => {
        const x1 = Math.max(0, x - offX), y1 = Math.max(0, y - offY);
        const x2 = Math.min(map.width - 1, x + offX2), y2 = Math.min(map.height - 1, y + offY2);
        const pixels = (x2 - x1) * (y2 - y1);
        const result: Color = c.slice() as Color;
        for (let i = 0; i < 3; i++) {
            result[i] = (sums[y2][x2][i] - sums[y2][x1][i] - sums[y1][x2][i] + sums[y1][x1][i]) / pixels;
        }
        return result;
    });
    return blurMap;
}

require.main === module && load('result').then(map => {
    const result = boxBlur(map, 5);
    save(result, "filtered");
});
