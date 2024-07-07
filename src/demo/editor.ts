import { GrayscalePixelMap, RGBAPixelMap, ColorMap, Colorizable, isConstructingPixelmap } from "../image-lib";
import { ImageGenerator, ImageFilter, ImageChannelFilter, Color, PixelMap } from "../PixelMap";
import { perlin2D, fractalPerlin2D } from "../utility/perlin";
import { clamp, createElement, exposeToWindow, getRangeMapper, mapRange, removeNonStandardCharacters } from "./util";
import { examples } from "./examples";
import { DataStorage } from "../storage/DataStorage";
import { SmartStorage } from "../storage/SmartStorage";

let editor: HTMLTextAreaElement;
let sourceCanvas, targetCanvas: HTMLCanvasElement;
let sourceContext, targetContext: CanvasRenderingContext2D;
let generatorSize: { width: number, height: number} | null = null;

let currentUserCodeName: string | null = null;
let userCodes: Record<string, string> = {};
const persistentStorage: DataStorage = new SmartStorage();

const INITIAL_USER_CODE = `applySourceToTarget();

// Your code here`
let imageStorage: HTMLImageElement[] = [];

window.addEventListener('load', () => {
    editor = document.getElementById("editor-text") as HTMLTextAreaElement;
    sourceCanvas = document.getElementById("source-canvas") as HTMLCanvasElement;
    sourceContext = sourceCanvas.getContext("2d");
    targetCanvas = document.getElementById("target-canvas") as HTMLCanvasElement;
    targetContext = targetCanvas.getContext("2d");

    // For our code snippets to work as a function based on raw text, we need to add classes to window scope
    exposeToWindow({
        sourceCanvas,
        targetCanvas,
        context: targetContext,
        targetContext,
        sourceContext,
        saveCurrentSnippet,
        GrayscalePixelMap,
        RGBAPixelMap,
        ColorMap,
        generate,
        gen,
        fill,
        filter,
        filterR,
        filterG,
        filterB,
        filterA,
        resize,
        rescale,
        crop,
        mirror,
        flip,
        wrap: wrapImageInPixelMap,
        combine,
        combine2: combine,
        combine3,
        applyImage: renderToTarget,
        applyTargetToSource,
        applySourceToTarget,
        getStored,
        getStoredImage,
        perlin2D,
        fractalPerlin2D,
        clamp,
        mapRange,
        getRangeMapper,
    })

    addExamples();
    prepareTextarea();

    // Allow dropping images to load
    turnIntoImageDropTarget(document.body, (img, _fieldId, target) => {
        if (target instanceof HTMLElement && ((target as any).storageIndex >= 0 || (target.parentElement as any).storageIndex >= 0)) {
            // Load to storage
            const index = (target as any).storageIndex ?? (target.parentElement as any).storageIndex;
            storeImage(img, +index);
        } else {
            // As main picture
            renderToSource(img);
            applySourceToTarget();
        }
    }, console.error);
    updateStorage();
});

function wrapImageInPixelMap(img: HTMLImageElement) {
    return RGBAPixelMap.fromImage(img);
}

function storeImage<T>(img: HTMLImageElement | PixelMap<T>, id?: number) {
    const image = img instanceof PixelMap ? img.toImage() : img;
    if (!image || !(image instanceof HTMLImageElement)) {
        console.error("Invalid image: ", img);
        return;
    }
    if (id == null || id < 0) {
        id = imageStorage.findIndex(v => v == null);
        if (id < 0) {
            id = imageStorage.length;
        }
    }
    imageStorage[id] = image;
    updateStorage();
}

function getStoredImage(index: number): HTMLImageElement | null {
    return imageStorage[index - 1] ?? null;
}

function getStored(index: number): RGBAPixelMap | null {
    const img = getStoredImage(index);
    if (img) {
        return wrapImageInPixelMap(img);
    }
    return null
}

function updateStorage() {
    const container = document.getElementById("image-storage");
    container.innerHTML = "";
    for (let i = imageStorage.length; i >= 0; i--) { // go one index further, to always show one empty option for user to drop image into
        const el = createElement("div", "image-storage-preview checkerboard", null, container);
        if (imageStorage[i]) {
            const img = createElement("img", "", "", el) as HTMLImageElement;
            img.src = imageStorage[i].src;
        }
        createElement("span", "", `${i + 1}`, el);
        (el as any).storageIndex = i;
    }
}

function generate(gen: Colorizable | ImageGenerator<Colorizable>, width = sourceCanvas.width, height = sourceCanvas.height) {
    generatorSize = { width, height };
    const map = new ColorMap(width, height, gen);
    generatorSize = null;
    renderToSource(map);
    renderToTarget(map);
    return map;
}
const gen = generate;
const fill = generate;

function filter(filterFunc: ImageFilter<Color>, map = targetToPixelmap()) {
    map.filter(filterFunc);
    renderToTarget(map);
    return map;
}

function filterR(filter: ImageChannelFilter, map = targetToPixelmap()) {
    map.filterR(filter);
    renderToTarget(map);
    return map;
}

function filterG(filter: ImageChannelFilter, map = targetToPixelmap()) {
    map.filterG(filter);
    renderToTarget(map);
    return map;
}

function filterB(filter: ImageChannelFilter, map = targetToPixelmap()) {
    map.filterB(filter);
    renderToTarget(map);
    return map;
}

function filterA(filter: ImageChannelFilter, map = targetToPixelmap()) {
    map.filterA(filter);
    renderToTarget(map);
    return map;
}

function combine<T, U>(img1: PixelMap<T>, img2: PixelMap<U>, mapping: ((c1: T, c2: U, x: number, y: number) => Color), stretchRelative = false): RGBAPixelMap {
    let result: RGBAPixelMap;
    if (stretchRelative) {
        // Relative 0...1 for both images, applying size of first image
        const width = img1.width, height = img1.height;
        const fx = (img2.width - 1) / (img1.width - 1), fy = (img2.height - 1) / (img1.height - 1);
        const relfx = 1 / (width - 1), relfy = 1 / (height - 1);
        result = new RGBAPixelMap(width, height, (x: number, y: number) => mapping(img1.get(x, y), img2.getSmooth(x * fx, y * fy), x * relfx, y * relfy));
    } else {
        // Absolute coords using min size of both images
        const width = Math.min(img1.width, img2.width);
        const height = Math.min(img1.height, img2.height);
        result = new RGBAPixelMap(width, height, (x: number, y: number) => mapping(img1.get(x, y), img2.get(x,y), x, y));
    }
    renderToTarget(result);
    return result;
}

function combine3<T, U, V>(img1: PixelMap<T>, img2: PixelMap<U>, img3: PixelMap<V>, mapping: ((c1: T, c2: U, c3: V, x: number, y: number) => Color), stretchRelative = false): RGBAPixelMap {
    let result: RGBAPixelMap;
    if (stretchRelative) {
        // Relative 0...1 for both images, applying size of first image
        const width = img1.width, height = img1.height;
        const fx2 = (img2.width - 1) / (img1.width - 1), fy2 = (img2.height - 1) / (img1.height - 1);
        const fx3 = (img3.width - 1) / (img1.width - 1), fy3 = (img3.height - 1) / (img1.height - 1);
        const relfx = 1 / (width - 1), relfy = 1 / (height - 1);
        result = new RGBAPixelMap(width, height, (x: number, y: number) => mapping(img1.get(x, y), img2.getSmooth(x * fx2, y * fy2), img3.getSmooth(x * fx3, y * fy3), x * relfx, y * relfy));
    } else {
        // Absolute coords using min size of both images
        const width = Math.min(img1.width, img2.width);
        const height = Math.min(img1.height, img2.height);
        result = new RGBAPixelMap(width, height, (x: number, y: number) => mapping(img1.get(x, y), img2.get(x,y), img3.get(x,y), x, y));
    }
    renderToTarget(result);
    return result;
}

function resize(width: number, height: number = width) {
    const map = targetToPixelmap();
    const cnv = map.toCanvas();
    targetCanvas.width = width;
    targetCanvas.height = height;
    targetContext.drawImage(cnv, 0, 0, width, height);
}

function crop(width: number, height: number = width, relAnchorX = 0, relAnchorY = relAnchorX) {
    const wDiff = targetCanvas.width - width, hDiff = targetCanvas.height - height;
    const offX = -relAnchorX * wDiff, offY = -relAnchorY * hDiff;
    const map = targetToPixelmap();
    const cnv = map.toCanvas();
    targetCanvas.width = width;
    targetCanvas.height = height;
    targetContext.drawImage(cnv, offX, offY);
}

function rescale(fx: number, fy = fx) {
    const w = Math.round(targetCanvas.width * fx), h = Math.round(targetCanvas.height * fy);
    resize(w, h);
}

function mirror() {
    const map = targetToPixelmap();
    const cnv = map.toCanvas();
    targetCanvas.width = targetCanvas.width;
    targetContext.save();
    targetContext.translate(cnv.width, 0);
    targetContext.scale(-1, 1);
    targetContext.drawImage(cnv, 0, 0);
    targetContext.restore();
}

function flip() {
    const map = targetToPixelmap();
    const cnv = map.toCanvas();
    targetContext.drawImage(cnv, 0, cnv.height, cnv.width, -cnv.height);
}

function prepareTextarea() {
    editor.addEventListener('keydown', (e: KeyboardEvent) => {
        // CTRL+Enter to execute code
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            runCode();
        }
    });
}

async function addExamples() {
    const container = document.getElementById('example-container');
    for (const name of Object.keys(examples)) {
        const button = document.createElement('button');
        button.className = 'example';
        button.textContent = name;
        button.onclick = () => {
            saveCurrentSnippet();
            const comment = `// ${name}`;
            const code = comment + '\n' + examples[name];
            setEditorText(code);
            currentUserCodeName = null;
        }
        container.appendChild(button);
    }
    // New Snippet button
    container.appendChild(document.createElement('BR'));
    const btn = document.createElement('button');
    btn.className = 'example new-snippet';
    btn.textContent = "New Snippet";
    btn.onclick = () => {
        saveCurrentSnippet();
        const name = createNewSnippet();
        if (name) {
            const button = document.createElement('button');
            button.className = 'example snippet';
            button.textContent = name;
            button.onclick = () => {
                saveCurrentSnippet();
                currentUserCodeName = name;
                setEditorText(userCodes[name] ?? '');
            }
            container.appendChild(button);
        }
    };
    container.appendChild(btn);
    container.appendChild(document.createElement('BR'));
    // User snippets
    const snippets = await persistentStorage.getValue('codes', null);
    if (snippets) {
        try {
            userCodes = JSON.parse(snippets);
            const codeNames = Object.keys(userCodes);
            for (const name of codeNames) {
                const button = document.createElement('button');
                button.className = 'example snippet';
                button.textContent = name;
                button.onclick = () => {
                    saveCurrentSnippet();
                    currentUserCodeName = name;
                    setEditorText(userCodes[name] ?? '');
                }
                container.appendChild(button);
            }
        } catch(e) {
            console.error(e);
        }
    }
}

function setEditorText(s: string) {
    editor.value = s;
    runCode();
}

function getEditorText() {
    return editor.value;
}

function createNewSnippet(): string | null {
    const name = removeNonStandardCharacters(prompt("Name of new code snippet. May include letters, numbers and the following special characters: -_,:+") ?? '');
    if (!name || name in userCodes) {
        if (name) {
            alert("Name '" + name + "' already taken! Please try again with a different name.");
        }
        return null;
    } else {
        currentUserCodeName = name;
        userCodes[name] = "// *** " + name + " ***\n" + INITIAL_USER_CODE;
        setEditorText(userCodes[name]);
        return name;
    }
}

function saveCurrentSnippet() {
    if (currentUserCodeName) {
        userCodes[currentUserCodeName] = getEditorText();
        saveAllSnippets();
    }
}

function saveAllSnippets() {
    persistentStorage.setValue('codes', JSON.stringify(userCodes));
}

function runCode() {
    const code = editor.value;
    try {
        prepareWindowScope();
        const fnc = new Function(code);
        const result = fnc();
        if (result) {
            renderToTarget(result);
        }
    } catch(e) {
        displayError(e);
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

function renderToTarget(result: PixelMap<any> | HTMLImageElement | HTMLCanvasElement) {
    renderToCanvas(result, targetCanvas);
}

function renderToSource(result: PixelMap<any> | HTMLImageElement | HTMLCanvasElement) {
    renderToCanvas(result, sourceCanvas);
}

function applyTargetToSource() {
    renderToSource(targetCanvas);
}

function applySourceToTarget() {
    renderToTarget(sourceCanvas);
}

function sourceToPixelmap(): RGBAPixelMap {
    const w = sourceCanvas.width;
    const imgData = sourceContext.getImageData(0, 0, w, sourceCanvas.height);
    const data = imgData.data;
    const map = new ColorMap(w, sourceCanvas.height, (x, y) => {
        const p = 4 * (x + y * w);
        return [ data[p], data[p + 1], data[p + 2], data[p + 3] ];
    });
    return map;
}

function targetToPixelmap(): RGBAPixelMap {
    const w = targetCanvas.width;
    const imgData = targetContext.getImageData(0, 0, w, targetCanvas.height);
    const data = imgData.data;
    const map = new ColorMap(w, targetCanvas.height, (x, y) => {
        const p = 4 * (x + y * w);
        return [ data[p], data[p + 1], data[p + 2], data[p + 3] ];
    });
    return map;
}

function prepareWindowScope() {
    Object.defineProperty(window, 'width', {
        get() {
            return generatorSize?.width ?? isConstructingPixelmap()?.width ?? targetCanvas.width;
        },
        set(value) {
            targetCanvas.width = value;
        },
        configurable: true,
        enumerable: true
    });
    Object.defineProperty(window, 'height', {
        get() {
            return generatorSize?.height ?? isConstructingPixelmap()?.height ?? targetCanvas.height;
        },
        set(value) {
            targetCanvas.height = value;
        },
        configurable: true,
        enumerable: true
    });
}

function displayError(e: any) {
    console.error(e);
}

function turnIntoImageDropTarget(div: HTMLElement, handleImage: (img: HTMLImageElement, fieldId: number, target: EventTarget) => void, handleError = (e: ErrorEvent) => {}, extraFields: string[] = []) {
    let extraContainer: HTMLElement | null = null;
  
    // Set up event listeners for the drag and drop events
    div.addEventListener("dragover", (event) => {
        event.preventDefault();
        // Visualize
        div.classList.add("drop-target");
        // Extra fields
        if (extraFields.length > 0 && !extraContainer) {
            extraContainer = createElement(
                "div",
                "drop-extra-container",
                extraFields.map((name: string) => createElement("div", "drop-extra-field", name)),
                div
            )
        }
    });
  
    div.addEventListener("dragleave", (event) => {
        if (event.target === document.body) {
            // End visualization
            clearDropOverlay();
        }
    });
  
    div.addEventListener("drop", (event) => {
        event.preventDefault();
        // Check if the file is an image
        const file = event.dataTransfer.files[0];
        if (file.type.startsWith("image/")) {
            // Handle the dropped image file
            const img = new Image();
            const reader = new FileReader();
            const fieldId = extraContainer ? Array.from(extraContainer.children).indexOf(event.target as HTMLElement) : -1;
            // Set up an event listener for the "load" event on the FileReader
            reader.addEventListener("load", () => {
                img.addEventListener("load", () => handleImage(img, fieldId, event.target));
                img.addEventListener("error", (error: ErrorEvent) => handleError(error));
                img.src = reader.result as string;
            });
            reader.readAsDataURL(file);
        }
    
        // End visualization
        clearDropOverlay();
    });

    function clearDropOverlay() {
        div.classList.remove("drop-target");
        extraContainer?.remove();
        extraContainer = null;
    }
  }
  
  export {
    generate,
    gen,
    filter,
    filterR,
    filterG,
    filterB,
    filterA,
    resize,
    rescale,
    crop,
    combine,
    applyTargetToSource,
    applySourceToTarget,
  }