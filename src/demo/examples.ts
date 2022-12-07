

export const examples = {
// Random noise
'random noise': 'return new GrayscalePixelMap(width, height, () => Math.random() * 255).toImage()',
// Checker board
'checker board': `const sz = 32;
return new GrayscalePixelMap(width, height,
    (x, y) => (Math.floor(x / sz) % 2) === (Math.floor(y / sz) % 2) ? 255 : 0).toImage();`,
// Spiral
'spiral': `return new GrayscalePixelMap(width, height, (x, y) => {
    const dx = x - width / 2, dy = y - height / 2;
    const angle = Math.atan2(dx, dy);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return 127.5 + 127.5 * Math.sin(3 * angle + 0.1 * distance);
}).toImage()`,
// Boxes
'boxes': `const boxes = [];
for (let i = 0; i < 50; i++) { boxes[i] = {x: Math.random() * width, y: Math.random() * height, w: 100, h: 100}}
return new GrayscalePixelMap(width, height, (x, y) => {
    const count = boxes.filter(box => x >= box.x && y >= box.y && x < box.x + box.w && y < box.y + box.h).length;
    return [0, 255, 160, 80][count % 4];
}).toImage()`,
// Julia fractal
'julia fractal': `const re = -0.4, im = 0.6;
const iterations = 128;
return new GrayscalePixelMap(width, height, (x0, y0) => {
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
}).toImage()`
}