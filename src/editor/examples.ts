import { Color } from "../PixelMap";
import { api } from "./editingApi";
import { ParameterHandler } from "./parameters";

const { use, get, getPixelMap, copy, copyTo, crop, filter, filterG, filterR, gen, rescale, resize, createCanvas, setFrameHandler } = api;

// Make compiler happy, even though examples will ultimately be executed in other scope and use global variables
let width = 0, height = 0;
let param: ParameterHandler;
let canvas, sourceCanvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;

function processExample(key: string, example: string) {
    example = example.replaceAll('0, editor_1.', '');
    // Remove function wrapper
    if (example.startsWith('function ')) {
        const lines = example.split('\n');
        const innerLines = lines.slice(1, lines.length - 1);
        const indentation = Math.min(...innerLines.map(line => line.length - line.trimLeft().length));
        const fixedLines = innerLines.map(line => line.substring(indentation));
        return fixedLines.join('\n');
    }
    return example;
}

const examplesArray = [
    function randomNoise() {
        gen((x, y) => Math.random() * 255, 1024, 1024);
    },
    function checkerBoard() {
        const sz = 32;
        gen((x, y) => (Math.floor(x / sz) % 2) === (Math.floor(y / sz) % 2) ? 255 : 0, 1024, 1024)
    },
    function spiral() {
        const branches = param.number('branches', 3, 1, 20);
        const disFactor = param.number('distance factor', 0.3, 0, 1, 0.001) ** 2;
        gen((x, y) => {
            const dx = x - width / 2, dy = y - height / 2;
            const angle = Math.atan2(dx, dy);
            const distance = Math.sqrt(dx * dx + dy * dy);
            return 127.5 + 127.5 * Math.sin(branches * angle + disFactor * distance);
        }, 1024, 1024);
        //> Generates a spiral
        //> Use parameters on the right to adjust its look
    },
    function boxes() {
        const boxes = [];
        for (let i = 0; i < 50; i++) {
            boxes[i] = {x: Math.random() * 1000, y: Math.random() * 1000, w: 100, h: 100}
        }
        gen((x, y) => {
            const count = boxes.filter(box => x >= box.x && y >= box.y && x < box.x + box.w && y < box.y + box.h).length;
            return [0, 255, 160, 80][count % 4];
        }, 1024, 1024)
    },
    function contextDrawing() {
        resize(1024, 1024);
        // You can affect the output canvas directly
        context.fillStyle = 'red';
        context.fillRect(0, 0, 1024, 1024);
        context.fillStyle = 'blue';
        context.fillRect(100, 100, 200, 200);
        context.fillStyle = "black";
        context.font = "48px Arial";
        context.fillText("Hello world", 400, 400);

        // Regular image-lib-js API is still working
        copyTo(1);

        // Or use copy(<canvas>, <id>) to copy from a canvas into a slot / source / target
        copy(canvas, 2);

        // You can create your own "offscreen" canvas:
        const myCanvas = createCanvas(); // if no size is provided, last used size is reused
        const myContext = myCanvas.getContext('2d');
        myContext.rotate(Math.PI / 8);
        myContext.shadowColor = 'gold';
        myContext.shadowBlur = 20;
        myContext.fillStyle = 'green';
        myContext.fillRect(200, 100, 600, 350);
        copy(myCanvas, 3); // copy to slot 3
        use(3);
        filter(c => [c[1], c[0], c[2], c[3]]); // flip channels

        // Use fancy features such as blend modes
        context.globalCompositeOperation = 'screen';
        context.drawImage(myCanvas, 150, 0);
    },
    function juliaFractal() {
        const size = param.isLiveUpdate ? 400 : 1024; // <- we do this to ensure that while dragging parameters, we get quick updates, but when releasing slider, we get a higher resolution image
        const re = param.slider('re', -0.4, -1, 1, 0.01, true);
        const im = param.slider('im', 0.6, -1, 1, 0.01, true);
        const iterations = param.number('Iterations (slow)', 256, 1, 1000);
        gen((x0, y0) => {
            // Map pixel space to [-2, 2]x[-2, 2] space
            let x = -2 + 4 * x0 / width, y = -2 + 4 * y0 / width + 2 * (width - height) / width;
            for (let i = 0; i < iterations; i++) {
                // Return when iteration diverges far enough from origin
                if (x * x + y * y > 4) {
                    return 255 * Math.sqrt(i / iterations);
                }
                // Compute next step
                const newx = x * x - y * y + re;
                y = 2 * x * y + im;
                x = newx;
            }
            return 0;
        }, size, size)
    },
    function juliaInteractive() {
        let size = 512; // <- we do this to ensure that while dragging parameters, we get quick updates, but when releasing slider, we get a higher resolution image
        let re = -0.4;
        let im = 0.6;
        const iterations = 512;
        setFrameHandler(({mouse}) => {
            if (mouse.left !== 0) {
                if (mouse.left > 0) {
                    // Map mouse position to [-2, 2]x[-2, 2] space
                    re = -2 + 4 * mouse.x / width;
                    im = -2 + 4 * mouse.y / width + 2 * (width - height) / width;
                    size = 400; // live update
                } else {
                    size = 1024; // release mouse -> higher resolution render
                }
                render();
            }
        })
        function render() {
            gen((x0, y0) => {
                // Map pixel space to [-2, 2]x[-2, 2] space
                let x = -2 + 4 * x0 / width, y = -2 + 4 * y0 / width + 2 * (width - height) / width;
                for (let i = 0; i < iterations; i++) {
                    // Return when iteration diverges far enough from origin
                    if (x * x + y * y > 4) {
                        return 255 * Math.sqrt(i / iterations);
                    }
                    // Compute next step
                    const newx = x * x - y * y + re;
                    y = 2 * x * y + im;
                    x = newx;
                }
                return 0;
            }, size, size);
        }

        //> Drag your mouse around on the canvas to change the fractal parameters
    },
    function resizing() {
        // Some random content
        gen((x, y) => [255 * x / 2048, 255 * y / 2048, ((x % 200) < 100) === ((y % 200) < 100) ? 255 : 0], 2048, 2048)
        copyTo(0);

        // Scale to some absolute size
        resize(1920, 1080);
        copyTo(1);

        // Scale relatively
        rescale(0.5);
        copyTo(2);

        // Crop to to left corner
        crop(600, 300);
        copyTo(3);
        
        // Crop to right center
        crop(200, 200, 1, 0.5);
    },
    function filters() {
        // We start with some random generator to have something to work with
        gen((x, y) => [x & y, x | y, x ^ y], 512, 512);
        copyTo(0);

        // Invert red
        filterR(v => 255-v);
        copyTo(1);

        // Flip around green
        filterG(v => Math.abs(255 - 2 * v));
        copyTo(2);

        // Adjust alpha
        filter(c => { c[3] = 255 - Math.max(c[0], c[1], c[2]) + Math.min(c[0], c[1], c[2]); return c })
    },
    function slotUsage() {
        copy(); // source -> target
        filter(c => [255-c[0], c[1], c[2], c[3]]); // invert red
        copyTo(1); // target -> slot 1
        use(1); // work on slot 1
        filter(c => [c[2], c[0], c[1], c[3]]); // flip channels
        use(); // work on target
    },
    function canvasAnimation() {
        resize(1280, 720);
        setFrameHandler(frameContext => {
            const { fps, frame, time } = frameContext;
            // Draw a moving circle
            context.fillStyle = 'black';
            context.fillRect(0, 0, width, height);
            context.fillStyle = 'red';
            context.beginPath();
            const t = time * Math.PI;
            const x = width * (0.5 + 0.3 * Math.sin(t));
            const y = height * (0.5 - 0.3 * Math.cos(t));
            context.arc(x, y, 50, 0, Math.PI * 2);
            context.fill();

            // Draw some text
            context.fillStyle = 'white';
            context.font = '36px Arial';
            context.fillText(`FPS: ${fps}`, 10, 40);
            context.fillText(`Frame: ${frame}`, 10, 80);
            context.fillText(`Time: ${time.toFixed(2)}s`, 10, 120);
        });
    },
    function canvasInteraction() {
        resize(1280, 720);
        setFrameHandler(frameContext => {
            const { mouse, keysDown } = frameContext;
            // Draw a circle at the mouse position
            context.fillStyle = 'black';
            context.fillRect(0, 0, width, height);
            context.fillStyle = 'red';
            context.beginPath();
            context.arc(mouse.x, mouse.y, 50, 0, Math.PI * 2);
            context.fill();

            // Draw some text
            context.fillStyle = 'white';
            context.font = '36px Arial';
            context.fillText(`Mouse: ${mouse.x.toFixed(0)}, ${mouse.y.toFixed(0)}`, 10, 40);
            context.fillText(`Keys: ${Array.from(keysDown).join(', ')}`, 10, 80);
        });
    },
    `
parameters:
const r = param.toggle('red');
const g = param.number('green', 0, 0, 255);
const b = param.slider('blue', 0, 0, 255, 1); // Usually, sliders only update at the end of a user interaction
const a = param.slider('alpha', 255, 0, 255, 1, true); // setting liveUpdate to true, even dragging the slider will cause rerender of the image

const seed = param.text('seed', '12345');
const button = param.button('Randomize', () => {
  param.get('seed').set(Math.floor(Math.random() * 100000).toString());
})

const color = param.color('color', '#ff0000ff');
const spot = param.select('spot', ["left", "middle", "right"], 1);
const midFactor = {
  "left": 0.25,
  "middle": 0.5,
  "right": 0.75,
}[spot];
const midx = width * midFactor

gen((x, y) => {
  if (x >= midx - 20 && x <= midx + 20) {
    return color;
  }
  return [r ? 255 : 0, g, b, a]
});
    `,
    function tileableCheckPixelmap() {
        const w = sourceCanvas.width;
        const h = sourceCanvas.height;
        const ofx = 1 - param.slider('Offset X', 0.5, 0, 1, 0.001, true);
        const ofy = 1 - param.slider('Offset Y', 0.5, 0, 1, 0.001, true);
        const offX = Math.round(ofx * w);
        const offY = Math.round(ofy * h);
        const sourceMap = getPixelMap(0);
        gen((x, y) => {
            const sx = (x + offX) % w;
            const sy = (y + offY) % h;
            return sourceMap.get(sx, sy);
        }, w * 2, h * 2);
    },
    function tileableCheckNative() {
        const w = sourceCanvas.width;
        const h = sourceCanvas.height;
        const tileableX = param.toggle('Tileable X', true);
        const tileableY = param.toggle('Tileable Y', true);
        const zoomOut = param.toggle('Zoom Out', false);
        let ofx = 0, ofy = 0;
        if (tileableX) {
            ofx = 1 - param.slider('Offset X', 0.5, 0, 1, 0.001, true);
        }
        if (tileableY) {
            ofy = 1 - param.slider('Offset Y', 0.5, 0, 1, 0.001, true);
        }
        const showGrid = param.toggle('Show Grid', false);
        const offX = Math.round(ofx * w);
        const offY = Math.round(ofy * h);
        const sizeFactor = zoomOut ? 2 : 1;
        canvas.width = w * (tileableX ? sizeFactor : 1);
        canvas.height = h * (tileableY ? sizeFactor : 1);
        const tilesX = tileableX ? sizeFactor + 1 : 1;
        const tilesY = tileableY ? sizeFactor + 1 : 1;
        // Images
        for (let x = 0; x < tilesX; x++) {
            const imgx = x * w - offX;
            for (let y = 0; y < tilesY; y++) {
                const imgy = y * h - offY;
                context.drawImage(sourceCanvas, imgx, imgy);
            }
        }
        // Grid lines
        if (showGrid) {
            context.fillStyle = 'green';
            const lineWidth = canvas.width / 200;
            for (let x = 0; x < tilesX; x++) {
                const imgx = x * w - offX;
                for (let y = 0; y < tilesY; y++) {
                    const imgy = y * h - offY;
                    // Right border
                    context.fillRect(imgx + w - lineWidth / 2, imgy, lineWidth, h);
                    // Bottom border
                    context.fillRect(imgx, imgy + h - lineWidth / 2, w, lineWidth);
                }
            }
        }
        //> If you want to check whether some image of yours is tileable, just drop it in here to check.
        //> Preview shows the image placed next to each other in x and y dimension.
        //> Use the parameters on the right to customize the preview.
    },
    function whiteCorrection() {
        copy();
        const white = param.color('white', '#ffffff') as Color;
        const black = param.color('black', '#000000') as Color;
        const whiteScale = param.slider('white correction', 0, 0, 1, 0.001);
        const blackScale = param.slider('black correction', 0, 0, 1, 0.001);
        const dr = white[0] - black[0];
        const dg = white[1] - black[1];
        const db = white[2] - black[2];
        const br = black[0] + dr * blackScale;
        const bg = black[1] + dg * blackScale;
        const bb = black[2] + db * blackScale;
        const wr = white[0] - dr * whiteScale;
        const wg = white[1] - dg * whiteScale;
        const wb = white[2] - db * whiteScale;
        const rFactor = 255 / (wr - br);
        const gFactor = 255 / (wg - bg);
        const bFactor = 255 / (wb - bb);
        filter(c => {
            // Apply white correction
            c[0] = (c[0] - br) * rFactor;
            c[1] = (c[1] - bg) * gFactor;
            c[2] = (c[2] - bb) * bFactor;
            return c;
        });
        //> This tool is useful for correcting e.g. photographs of paper write-ups or whiteboard sketches.
        //> Ideally proceed as follows:
        //> 1. Load the image you want to edit by dropping it onto the page.
        //> 2. Use the "white" and "black" color pickers to select the darkest color that shall be white, and the brightest color that shall be black.
        //> 3. If the adjustment is insufficient, increase the correction sliders until you like the result.
    },
    // function combineIntoOne() {
    `
    combineIntoOne:
        const sources = [];
        if (param.toggle('Include source', true)) {
            sources.push(sourceCanvas);
        }
        let i = 1;
        while (true) {
            const img = get(i++);
            if (!img) { break; }
            sources.push(img);
        }
        const layout = param.select('Layout', ['Vertical', 'Horizontal', 'Freeform']);
        const vertical = layout === 'Vertical';
        const horizontal = layout === 'Horizontal';
        const freeform = layout === 'Freeform';
        const sorting = param.select('Sort By', ['Auto', 'None', 'Width', 'Height']);
        if (sorting === 'Width') {
            sources.sort((a, b) => (b.naturalWidth || b.width) - (a.naturalWidth || a.width));
        } else if (sorting === 'Height') {
            sources.sort((a, b) => (b.naturalHeight || b.height) - (a.naturalHeight || a.height));
        }
        if (param.toggle('Invert Order', false)) {
            sources.reverse();
        }
        if (freeform) {
            // Freeform layout
            const attempts = param.number('Attempts', 20, 1, 100);
            let bestRects = [];
            let bestSize = Infinity;
            let bestW = 0, bestH = 0;
            for (let attempt = 0; attempt < attempts; attempt++) {
                const rects = [{x1:-1000, y1:-1000, x2:1000000, y2:0}, {x1:-1000, y1:-1000, x2:0, y2:1000000}];
                let maxW = 0, maxH = 0;
                if (sorting === 'Auto') {
                    // Random order
                    sources.sort(() => Math.random() - 0.5);
                }
                const checkCollision = (x, y, w, h) => rects.some(rect => !(x >= rect.x2 || x + w < rect.x1 || y >= rect.y2 || y + h < rect.y1));
                for (const source of sources) {
                    const sw = (source.naturalWidth || source.width);
                    const sh = (source.naturalHeight || source.height);
                    const maxPos = Math.max(maxW, maxH) + 1;
                    let x = Math.round(Math.random() * 2 * maxPos);
                    let y = 2 * maxPos - x;
                    while (true) {
                        // Walk diagonally with sliding collision until no further movement is possible
                        const nx = x - 1, ny = y - 1;
                        let moved = false;
                        if (!checkCollision(nx, y, sw, sh)) { x = nx; moved = true; }
                        if (!checkCollision(x, ny, sw, sh)) { y = ny; moved = true; }
                        if (!moved) {
                            // No further movement possible
                            rects.push({x1: x, y1: y, x2: x + sw, y2: y + sh, img: source});
                            maxW = Math.max(maxW, x + sw);
                            maxH = Math.max(maxH, y + sh);
                            break;
                        }
                    }
                }
                // Best attempt?
                const size = maxW * maxH;
                if (size < bestSize) {
                    bestSize = size;
                    bestRects = rects;
                    bestW = maxW;
                    bestH = maxH;
                }
            }
            // Place images
            bestRects.splice(0, 2);
            canvas.width = bestW;
            canvas.height = bestH;
            for (rect of bestRects) {
                context.drawImage(rect.img, rect.x1, rect.y1);
            }
        } else {
            // Vertical or Horizontal stacking
            if (vertical) {
                // Stack vertically
                const maxW = Math.max(...sources.map(s => s.naturalWidth || s.width));
                const totalH = sources.reduce((acc, s) => acc + (s.naturalHeight || s.height), 0);
                canvas.width = maxW;
                canvas.height = totalH;
            } else if (horizontal) {
                // Stack horizontally
                const totalW = sources.reduce((acc, s) => acc + (s.naturalWidth || s.width), 0);
                const maxH = Math.max(...sources.map(s => s.naturalHeight || s.height));
                canvas.width = totalW;
                canvas.height = maxH;
            }
            let x = 0, y = 0;
            for (const source of sources) {
                const w = (source).naturalWidth || source.width;
                const h = (source).naturalHeight || source.height;
                context.drawImage(source, x, y);
                if (vertical) {
                    y += h;
                } else {
                    x += w;
                }
            }
        }
        //> How to use this tool:
        //> 1. Drag your desired images into the slots at the top (and optionally the Source panel on the left)
        //> 2. Select a Layout style in the menu on the right.
        //> 3. All other options are pretty much optional and usually not needed.
        //> Note: "Freeform" means that images are placed as compactly as possible in 2D space. Randomness is involved here. If you increase the attempts value, it may take longer, but has a better chance of finding a good packing order.
    `,
    // }
]

export const examples = {}
for (const example of examplesArray) {
    if (example instanceof Function) {
        const key = example.name;
        const code = processExample(key, example.toString());
        examples[key] = code;
    } else {
        const fullText = example.trim();
        const p = fullText.indexOf(':');
        const key = fullText.slice(0, p).trim();
        const code = fullText.slice(p + 1).trim();
        examples[key] = code;
    }
}
