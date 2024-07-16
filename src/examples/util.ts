import { Canvas } from "canvas";
import { PixelMap } from "../PixelMap";
import * as fs from "fs";

export function show<T>(map: PixelMap<T>, filename: string = "result") {
    const canvas = map.toCanvas() as Canvas;
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('output/' + filename + '.png', buffer);
}