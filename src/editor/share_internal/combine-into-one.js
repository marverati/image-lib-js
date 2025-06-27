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
