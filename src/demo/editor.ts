import { GrayscalePixelMap, RGBAPixelMap, ColorMap, Color, PixelMap, Colorizable, ImageGenerator, ImageFilter, ImageChannelFilter, isConstructingPixelmap } from "../image-lib";
import { perlin2D, fractalPerlin2D } from "../utility/perlin";
import { clamp, exposeToWindow, removeNonStandardCharacters, getRangeMapper, mapRange } from "./util";
import { examples } from "./examples";
import { DataStorage } from "../storage/DataStorage";
import { SmartStorage } from "../storage/SmartStorage";

let editor: HTMLTextAreaElement;
let sourceCanvas, targetCanvas: HTMLCanvasElement;
let sourceContext, targetContext: CanvasRenderingContext2D;
let generatorSize: { width: number, height: number} | null = null;

let currentUserCodeName: string | null = null;
let userCodes: Record<string, string> = {};
const storage: DataStorage = new SmartStorage();

const INITIAL_USER_CODE = `applySourceToTarget();

// Your code here`

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
        applyImage: renderToTarget,
        applyTargetToSource,
        applySourceToTarget,
        perlin2D,
        fractalPerlin2D,
        clamp,
        mapRange,
        getRangeMapper,
    })

    addExamples();
    prepareTextarea();

    // Allow dropping images into
    turnIntoImageDropTarget(document.body, (img) => { renderToSource(img); applySourceToTarget(); });
});

function generate(gen: Colorizable | ImageGenerator<Colorizable>, width = sourceCanvas.width, height = sourceCanvas.height) {
    generatorSize = { width, height };
    const map = new ColorMap(width, height, gen);
    generatorSize = null;
    renderToSource(map);
    renderToTarget(map);
    return map;
}
const gen = generate;

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
        const button = document.createElement('button');
        button.className = 'example snippet';
        button.textContent = name;
        button.onclick = () => {
            saveCurrentSnippet();
            currentUserCodeName = name;
            setEditorText(userCodes[name] ?? '');
        }
        container.appendChild(button);
    };
    container.appendChild(btn);
    container.appendChild(document.createElement('BR'));
    // User snippets
    const snippets = await storage.getValue('codes', null);
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
    const name = removeNonStandardCharacters(prompt("Name of new code snippet. May include letters, numbers and the following special characters: -_,:+"));
    if (name === "" || name in userCodes) {
        alert("Name '" + name + "' already taken! Please try again with a different name.");
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
    storage.setValue('codes', JSON.stringify(userCodes));
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

function turnIntoImageDropTarget(div: HTMLElement, handleImage: (img: HTMLImageElement) => void, handleError = (e: ErrorEvent) => {}) {
  
    // Set up event listeners for the drag and drop events
    div.addEventListener("dragover", (event) => {
      event.preventDefault();
      // Visualize
      div.classList.add("drop-target");
    });
  
    div.addEventListener("dragleave", () => {
      // End visualization
      div.classList.remove("drop-target");
    });
  
    div.addEventListener("drop", (event) => {
      event.preventDefault();
      // Check if the file is an image
      const file = event.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        // Handle the dropped image file
        const img = new Image();
        const reader = new FileReader();
        // Set up an event listener for the "load" event on the FileReader
        reader.addEventListener("load", () => {
            img.addEventListener("load", () => handleImage(img));
            img.addEventListener("error", (error: ErrorEvent) => handleError(error));
            img.src = reader.result as string;
        });
        reader.readAsDataURL(file);
      }
  
      // End visualization
      div.classList.remove("drop-target");
    });
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
    applyTargetToSource,
    applySourceToTarget,
  }