
import { ImageLib } from "../image-lib";
import { save } from "./util";

const rowHeight = 24;
const brickWidth = 48;
const gapWidth = 2;

const map = ImageLib.generate((x, y) => {
    const yInRow = y % rowHeight;
    const row = Math.floor(y / rowHeight);
    const xOffset = row % 2 === 0 ? 0 : brickWidth / 2;
    const xInBrick = (x + xOffset) % brickWidth;
    const isInGap = xInBrick < gapWidth || yInRow < gapWidth;
    return isInGap ? 0 : 255;
}, 512, 512);
save(map);