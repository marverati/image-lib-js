
import { ImageLib } from "../image-lib";
import { save } from "./util";

export const genBrick = (brickWidth = 48, rowHeight = 24, gapWidth = 2) => ImageLib.generate((x, y) => {
    const yInRow = y % rowHeight;
    const row = Math.floor(y / rowHeight);
    const xOffset = row % 2 === 0 ? 0 : brickWidth / 2;
    const xInBrick = (x + xOffset) % brickWidth;
    const isInGap = xInBrick < gapWidth || yInRow < gapWidth;
    return isInGap ? 0 : 255;
});


require.main === module && (() => {
    const map = genBrick();
    save(map);
})();