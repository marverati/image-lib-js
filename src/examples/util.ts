// Conditional imports for Node.js vs Browser
let nodeCanvas: any, nodeFs: any;
try {
    if (typeof window === 'undefined') {
        // Only import in Node.js environment
        nodeCanvas = require("canvas");
        nodeFs = require("fs");
    }
} catch (e) {
    // Ignore import errors in browser
}

import { PixelMap } from "../PixelMap";
import { RGBAPixelMap } from "../image-lib";

export function save<T>(map: PixelMap<T>, filename: string = "result") {
    if (typeof window !== 'undefined') {
        // Browser environment - download as file
        const canvas = map.toCanvas();
        const link = document.createElement('a');
        link.download = filename + '.png';
        link.href = canvas.toDataURL();
        link.click();
        return;
    }
    
    // Node.js environment
    if (!nodeFs || !nodeCanvas) {
        throw new Error('Node.js canvas and fs modules not available');
    }
    
    // Ensure output directory exists
    if (!nodeFs.existsSync('output')) {
        nodeFs.mkdirSync('output');
    }
    const canvas = map.toCanvas() as any;
    const buffer = canvas.toBuffer('image/png');
    nodeFs.writeFileSync('output/' + filename + '.png', buffer);
}

export async function loadOrGenerate(filename: string, generator: () => RGBAPixelMap): Promise<RGBAPixelMap> {
    try {
        return await load(filename);
    } catch (e) {
        const map = await generator();
        save(map, filename);
        return map;
    }
}

export async function load(filename: string): Promise<RGBAPixelMap> {
    if (typeof window !== 'undefined') {
        // Browser environment - not typically used for file loading
        throw new Error('File loading not supported in browser environment');
    }
    
    // Node.js environment
    if (!nodeCanvas) {
        throw new Error('Node.js canvas module not available');
    }
    
    if (!filename.includes('.')) {
        filename += '.png';
    }
    if (!filename.includes('/')) {
        filename = 'output/' + filename;
    }
    
    // Load the image from the file system
    const image = await nodeCanvas.loadImage(filename);
    
    // Create a canvas and get its context
    const canvas = nodeCanvas.createCanvas(image.width, image.height);
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