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