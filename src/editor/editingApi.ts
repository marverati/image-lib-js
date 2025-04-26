import { RGBAPixelMap, ColorMap, Colorizable } from "../image-lib";
import { ImageGenerator, ImageFilter, ImageChannelFilter, Color, PixelMap } from "../PixelMap";
import { FrameHandler, updateAndGetFrameContext } from "./interaction";

let currentTarget = -1; // -1 = Target img, 0 = source img, >0 = slots
export let sourceCanvas: HTMLCanvasElement, targetCanvas: HTMLCanvasElement;

export let generatorSize: { width: number, height: number} | null = null;


/** Callback scripts can define to render animations or react to mouse movement */
let frameHandler: FrameHandler | null = null;

export function initCanvases(source: HTMLCanvasElement, target: HTMLCanvasElement) {
    sourceCanvas = source;
    targetCanvas = target;
}

let getFromSlot: (id: number) => HTMLImageElement | HTMLCanvasElement;
let storeInSlot: (img: HTMLImageElement | HTMLCanvasElement, id) => void;
export function initSlotUsage(slotGetter: typeof getFromSlot, slotSetter: typeof storeInSlot) {
    getFromSlot = slotGetter;
    storeInSlot = slotSetter;
}

function use(target: number = -1) {
    currentTarget = target;
}

function copyFrom(fromId: number = 0) {
    copy(fromId, currentTarget);
}

function copyTo(toId: number = -1) {
    copy(currentTarget, toId);
}

function copy(): void;
function copy(fromId: number | HTMLImageElement | HTMLCanvasElement, toId: number): void;
function copy(fromId?: number | HTMLImageElement | HTMLCanvasElement, toId?: number) {
    if (fromId == null && toId == null) {
        fromId = 0;
        toId = -1;
    }
    if (fromId === toId) {
        return;
    }
    const img = typeof fromId === 'number' ? getCurrentCanvasOrImage(fromId) : fromId;
    applyImage(img, toId);
}

function renderToCurrentTarget(map: PixelMap<Color>, id = currentTarget) {
    if (id === -1) {
        renderToCanvas(map, targetCanvas);
    } else if (id === 0) {
        renderToCanvas(map, sourceCanvas);
    } else {
        renderToSlot(map, id - 1);
    }
}

export function applyImage(cnv: HTMLCanvasElement | HTMLImageElement, id = currentTarget) {
    if (id === -1) {
        renderToCanvas(cnv, targetCanvas);
    } else if (id === 0) {
        renderToCanvas(cnv, sourceCanvas);
    } else {
        renderToSlot(cnv, id - 1);
    }
}

export function getPixelMapForImage(img: HTMLCanvasElement | HTMLImageElement): RGBAPixelMap {
    let cnv: HTMLCanvasElement;
    if (img instanceof HTMLCanvasElement) {
        cnv = img;
    } else {
        cnv = document.createElement("canvas");
        cnv.width = img.naturalWidth;
        cnv.height = img.naturalHeight;
        cnv.getContext("2d").drawImage(img, 0, 0);
    }
    const w = cnv.width;
    const imgData = cnv.getContext("2d").getImageData(0, 0, w, cnv.height);
    const data = imgData.data;
    const map = new ColorMap(w, cnv.height, (x, y) => {
        const p = 4 * (x + y * w);
        return [ data[p], data[p + 1], data[p + 2], data[p + 3] ];
    });
    return map;
}

function getCurrentPixelMap(id = currentTarget) {
    const img = getCurrentCanvasOrImage(id);
    return getPixelMapForImage(img);
}

function getCurrentCanvasOrImage(id = currentTarget) {
    if (id === -1) {
        return targetCanvas;
    } else if (id === 0) {
        return sourceCanvas;
    } else {
        return getFromSlot(id - 1);
    }
}

export function wrapImageInPixelMap(img: HTMLImageElement) {
    return RGBAPixelMap.fromImage(img);
}

export function wrapCanvasInPixelMap(cnv: HTMLCanvasElement) {
    return RGBAPixelMap.fromCanvas(cnv);
}

function getCurrentSize() {
    const img = getCurrentCanvasOrImage();
    if (img instanceof HTMLCanvasElement) {
        return { width: img.width, height: img.height };
    } else {
        return { width: img.naturalWidth, height: img.naturalHeight };
    }
}


function renderToCanvas(result: PixelMap<any> | HTMLImageElement | HTMLCanvasElement, canvas: HTMLCanvasElement) {
    if (result instanceof PixelMap) {
        result.toCanvas(canvas);
        return;
    }
    if (result instanceof Image || (result instanceof HTMLCanvasElement && result !== canvas)) {
        if (result instanceof Image && result.naturalWidth === 0) {
            // Wait for image to load
            const img = result;
            result.addEventListener('load', () => {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                canvas.getContext("2d").drawImage(img, 0, 0);
            });
        } else {
            // Render immediately
            canvas.width = result instanceof Image ? result.naturalWidth : result.width;
            canvas.height = result instanceof Image ? result.naturalHeight : result.height;
            canvas.getContext("2d").drawImage(result, 0, 0);
        }
    }
}

function renderToSlot(result: PixelMap<any> | HTMLImageElement | HTMLCanvasElement, slot: number) {
    if (!(result instanceof PixelMap)) {
        storeInSlot(result, slot);
        return;
    }
    const cnv = document.createElement("canvas");
    renderToCanvas(result, cnv);
    const img = new Image();
    img.src = cnv.toDataURL();
    storeInSlot(img, slot);
}

// --------------------
// ---- Below: API ----
// --------------------

function generate(
    gen: Colorizable | ImageGenerator<Colorizable>,
    width?: number,
    height?: number,
) {
    if (width == null) {
        const size = getCurrentSize();
        width = size.width;
        height = height ?? size.height;
    } else if (height == null) {
        height = width;
    }
    generatorSize = { width, height };
    const map = new ColorMap(width, height, gen);
    generatorSize = null;
    renderToCurrentTarget(map);
    return map;
}
const gen = generate;
const fill = generate;

function filter(filterFunc: ImageFilter<Color>, map = getCurrentPixelMap()) {
    map.filterBuffered(filterFunc);
    renderToCurrentTarget(map);
    return map;
}

function filterInplace(filterFunc: ImageFilter<Color>, map = getCurrentPixelMap()) {
    map.filter(filterFunc);
    renderToCurrentTarget(map);
    return map;
}

function filterR(filter: ImageChannelFilter, map = getCurrentPixelMap()) {
    map.filterR(filter);
    renderToCurrentTarget(map);
    return map;
}

function filterG(filter: ImageChannelFilter, map = getCurrentPixelMap()) {
    map.filterG(filter);
    renderToCurrentTarget(map);
    return map;
}

function filterB(filter: ImageChannelFilter, map = getCurrentPixelMap()) {
    map.filterB(filter);
    renderToCurrentTarget(map);
    return map;
}

function filterA(filter: ImageChannelFilter, map = getCurrentPixelMap()) {
    map.filterA(filter);
    renderToCurrentTarget(map);
    return map;
}

function combine<T, U>(
    img1: PixelMap<T>,
    img2: PixelMap<U>,
    mapping: ((c1: T, c2: U, x: number, y: number) => Color),
    stretchRelative = false
): RGBAPixelMap {
    let result: RGBAPixelMap;
    if (stretchRelative) {
        // Relative 0...1 for both images, applying size of first image
        const width = img1.width, height = img1.height;
        const fx = (img2.width - 1) / (img1.width - 1), fy = (img2.height - 1) / (img1.height - 1);
        const relfx = 1 / (width - 1), relfy = 1 / (height - 1);
        result = new RGBAPixelMap(width, height, (x: number, y: number) => mapping(img1.get(x, y), img2.get(x * fx, y * fy), x * relfx, y * relfy));
    } else {
        // Absolute coords using min size of both images
        const width = Math.min(img1.width, img2.width);
        const height = Math.min(img1.height, img2.height);
        result = new RGBAPixelMap(width, height, (x: number, y: number) => mapping(img1.get(x, y), img2.get(x,y), x, y));
    }
    renderToCurrentTarget(result);
    return result;
}

function combine3<T, U, V>(
    img1: PixelMap<T>,
    img2: PixelMap<U>,
    img3: PixelMap<V>,
    mapping: ((c1: T, c2: U, c3: V, x: number, y: number) => Color),
    stretchRelative = false
): RGBAPixelMap {
    let result: RGBAPixelMap;
    if (stretchRelative) {
        // Relative 0...1 for both images, applying size of first image
        const width = img1.width, height = img1.height;
        const fx2 = (img2.width - 1) / (img1.width - 1), fy2 = (img2.height - 1) / (img1.height - 1);
        const fx3 = (img3.width - 1) / (img1.width - 1), fy3 = (img3.height - 1) / (img1.height - 1);
        const relfx = 1 / (width - 1), relfy = 1 / (height - 1);
        result = new RGBAPixelMap(width, height, (x: number, y: number) => mapping(img1.get(x, y), img2.get(x * fx2, y * fy2), img3.get(x * fx3, y * fy3), x * relfx, y * relfy));
    } else {
        // Absolute coords using min size of both images
        const width = Math.min(img1.width, img2.width);
        const height = Math.min(img1.height, img2.height);
        result = new RGBAPixelMap(width, height, (x: number, y: number) => mapping(img1.get(x, y), img2.get(x,y), img3.get(x,y), x, y));
    }
    renderToCurrentTarget(result);
    return result;
}

function resize(width: number, height: number = width) {
    const src = getCurrentCanvasOrImage();
    const cnv = document.createElement("canvas");
    cnv.width = width;
    cnv.height = height;
    const ctx = cnv.getContext("2d")!;
    ctx.drawImage(src, 0, 0, width, height);
    applyImage(cnv);
}

function crop(
    width: number,
    height: number = width,
    relAnchorX = 0,
    relAnchorY = relAnchorX
) {
    const src = getCurrentCanvasOrImage();
    const size = getCurrentSize();
    const wDiff = size.width - width, hDiff = size.height - height;
    const offX = relAnchorX * wDiff, offY = relAnchorY * hDiff;
    const cnv = document.createElement("canvas");
    cnv.width = width;
    cnv.height = height;
    const ctx = cnv.getContext("2d")!;
    ctx.drawImage(src, offX, offY, width, height, 0, 0, width, height);
    applyImage(cnv);
}

function rescale(fx: number, fy = fx) {
    const size = getCurrentSize();
    const w = Math.round(size.width * fx), h = Math.round(size.height * fy);
    resize(w, h);
}

function mirror() {
    const map = getCurrentPixelMap();
    filter((c, x, y) => map.get(map.width - 1 - x, y));
}

function flip() {
    const map = getCurrentPixelMap();
    filter((c, x, y) => map.get(x, map.height - 1 - y));
}

function createCanvas(width?: number, height?: number) {
    const size = getCurrentSize();
    const w = width ?? size.width;
    const h = height ?? size.height;
    const cnv = document.createElement("canvas");
    cnv.width = w;
    cnv.height = h;
    return cnv;
}

let frameHandlerRunning = false;
function setFrameHandler(handler: FrameHandler | null) {
    if (handler !== frameHandler) {
        frameHandler = handler;
        if (!frameHandlerRunning) {
            internalUpdateFrame();
        }
    }
}

function internalUpdateFrame() {
    if (!frameHandler) {
        frameHandlerRunning = false;
        return;
    }
    const context = updateAndGetFrameContext(); // provides mouse state, keyboard state, time etc.
    const result = frameHandler(context);
    if (result === false) {
        setFrameHandler(null);
        frameHandlerRunning = false;
        return;
    }
    frameHandlerRunning = true;
    requestAnimationFrame(internalUpdateFrame);
}

export const api = {
    use,
    get: getCurrentCanvasOrImage,
    copy,
    copyFrom,
    copyTo,
    generate,
    gen,
    fill,
    filter,
    filterInplace,
    filterR,
    filterG,
    filterB,
    filterA,
    resize,
    rescale,
    crop,
    combine,
    combine3,
    mirror,
    flip,
    createCanvas,
    setFrameHandler,
}
