import { Canvas, loadImage, createCanvas } from "canvas";
import { PixelMap } from "../PixelMap";
import * as fs from "fs";
import { RGBAPixelMap } from "../image-lib";

export function show<T>(map: PixelMap<T>, filename: string = "result") {
    const canvas = map.toCanvas() as Canvas;
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('output/' + filename + '.png', buffer);
}

export async function load(filename: string): Promise<RGBAPixelMap> {
    
    // Load the image from the file system
    const image = await loadImage(filename);
    
    // Create a canvas and get its context
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    
    // Draw the image onto the canvas
    ctx.drawImage(image, 0, 0);
    
    // Get the image data (pixel data)
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    
    // Extract the pixel data from the imageData
    const pixelData = imageData.data; // This is a Uint8ClampedArray

    // Assuming RGBAPixelMap takes width, height, and pixelData as arguments
    const pixelMap = new RGBAPixelMap(image.width, image.height, (x, y) => {
        const p = 4 * (image.width * y + x)
        return [
            pixelData[p],
            pixelData[p + 1],
            pixelData[p + 2],
            pixelData[p + 3],
        ]
    });

    return pixelMap;
}