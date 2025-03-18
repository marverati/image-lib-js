import { api } from "./editingApi";

const { use, copy, copyTo, crop, filter, filterG, filterR, gen, rescale, resize } = api;

// Make compiler happy, even though examples will ultimately be executed in other scope and use global variables
let width = 0, height = 0;

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
        gen((x, y) => {
            const dx = x - width / 2, dy = y - height / 2;
            const angle = Math.atan2(dx, dy);
            const distance = Math.sqrt(dx * dx + dy * dy);
            return 127.5 + 127.5 * Math.sin(3 * angle + 0.1 * distance);
        }, 1024, 1024)
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
    function juliaFractal() {
        const re = -0.4, im = 0.6;
        const iterations = 128;
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
const g = param.toggle('green');
const b = param.toggle('blue');
gen((x, y) => [r ? 255 : 0, g ? 255 : 0, b ? 255 : 0, 255]);
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
