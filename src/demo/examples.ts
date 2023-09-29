

export const examples = {
// Random noise
'random noise': 'return new GrayscalePixelMap(1024, 1024, () => Math.random() * 255).toImage()',
// Checker board
'checker board': `const sz = 32;
return new GrayscalePixelMap(1024, 1024,
    (x, y) => (Math.floor(x / sz) % 2) === (Math.floor(y / sz) % 2) ? 255 : 0).toImage();`,
// Spiral
'spiral': `return new GrayscalePixelMap(1024, 1024, (x, y) => {
    const dx = x - width / 2, dy = y - height / 2;
    const angle = Math.atan2(dx, dy);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return 127.5 + 127.5 * Math.sin(3 * angle + 0.1 * distance);
}, 512, 512).toImage()`,
// Boxes
'boxes': `const boxes = [];
for (let i = 0; i < 50; i++) { boxes[i] = {x: Math.random() * width, y: Math.random() * height, w: 100, h: 100}}
return new GrayscalePixelMap(1024, 1024, (x, y) => {
    const count = boxes.filter(box => x >= box.x && y >= box.y && x < box.x + box.w && y < box.y + box.h).length;
    return [0, 255, 160, 80][count % 4];
}).toImage()`,
// Julia fractal
'julia fractal': `const re = -0.4, im = 0.6;
const iterations = 128;
return new GrayscalePixelMap(1024, 1024, (x0, y0) => {
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
}).toImage()`,
// Resizing
'resizing': `// Some random content
gen((x, y) => [255 * x / 2048, 255 * y / 2048, ((x % 200) < 100) === ((y % 200) < 100) ? 255 : 0], 2048, 2048)
// Scale to some absolute size
resize(1920, 1080);
// Scale relatively
rescale(0.5);
// Crop to to left corner
crop(600, 300);
// Crop to right center
crop(200, 200, 1, 0.5);`,
}