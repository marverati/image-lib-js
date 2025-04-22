import { api } from "./editingApi";
import { ParameterHandler } from "./parameters";

const { use, copy, copyTo, crop, filter, filterG, filterR, gen, rescale, resize, createCanvas } = api;

// Make compiler happy, even though examples will ultimately be executed in other scope and use global variables
let width = 0, height = 0;
let param: ParameterHandler;
let canvas: HTMLCanvasElement;
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
        const re = param.slider('re', -0.4, -1, 1, 0.01);
        const im = param.slider('im', 0.6, -1, 1, 0.01);
        const iterations = param.number('iterations', 128, 1, 1000);
        gen((x0, y0) => {
            // Map pixel space to [-2, 2]x[-2, 2] space
            let x = -2 + 4 * x0 / width, y = -2 + 4 * y0 / width + 2 * (width - height) / width;
            for (let i = 0; i < iterations; i++) {
                // Return when iteration diverges far enough from origin
                if (x * x + y * y > 4) {
                    return 255 * i / iterations;
                }
                // Compute next step
                const newx = x * x - y * y + re;
                y = 2 * x * y + im;
                x = newx;
            }
            return 0;
        }, 800, 800)
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
