import { GrayscalePixelMap, RGBAPixelMap, ColorMap, Color, PixelMap, Colorizable, ImageGenerator, ImageFilter } from "../image-lib";
import { perlin2D, fractalPerlin2D } from "../utility/perlin";
import { exposeToWindow } from "./util";
import { examples } from "./examples";

let editor: HTMLTextAreaElement;
let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;

window.addEventListener('load', () => {
    editor = document.getElementById("editor-text") as HTMLTextAreaElement;
    canvas = document.getElementById("editor-canvas") as HTMLCanvasElement;
    context = canvas.getContext("2d");

    // For our code snippets to work as a function based on raw text, we need to add classes to window scope
    exposeToWindow({
        canvas,
        context,
        GrayscalePixelMap,
        RGBAPixelMap,
        ColorMap,
        generate,
        gen: generate,
        filter,
        perlin2D,
        fractalPerlin2D,
    })

    addExamples();
    prepareTextarea();
});

function generate(gen: Colorizable | ImageGenerator<Colorizable>, width = canvas.width, height = canvas.height) {
    const map = new ColorMap(width, height, gen);
    renderToPreview(map);
    return map;
}

function filter(filterFunc: ImageFilter<Color>, map = previewToPixelmap()) {
    const wrappedFilterFunc = (c, x, y) => {
        const result = filterFunc(c, x, y);
        if (!(result instanceof Array) && typeof result === 'number') {
            return [result, result, result, 255] as Color;
        }
        return result;
    }
    map.filter(wrappedFilterFunc);
    renderToPreview(map);
    return map;
}

function prepareTextarea() {
    editor.addEventListener('keydown', (e: KeyboardEvent) => {
        // CTRL+Enter to execute code
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            runCode();
        }
    });
}

function addExamples() {
    const container = document.getElementById('example-container');
    for (const name of Object.keys(examples)) {
        const button = document.createElement('button');
        button.className = 'example';
        button.textContent = name;
        button.onclick = () => {
            const comment = `// ${name}`;
            const code = comment + '\n' + examples[name];
            setEditorText(code);
        }
        container.appendChild(button);
    }
}

function setEditorText(s: string) {
    editor.value = s;
    runCode();
}

function runCode() {
    const code = editor.value;
    try {
        prepareWindowScope();
        const fnc = new Function(code);
        const result = fnc();
        if (result) {
            renderToPreview(result);
        }
    } catch(e) {
        displayError(e);
    }
}

function renderToPreview(result: PixelMap<any> | HTMLImageElement | HTMLCanvasElement) {
    if (result instanceof PixelMap) {
        result = result.toImage();
    }
    if (result instanceof Image || (result instanceof HTMLCanvasElement && result !== canvas)) {
        if (result instanceof Image && result.naturalWidth === 0) {
            // Wait for image to load
            const img = result;
            result.addEventListener('load', () => {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                context.drawImage(img, 0, 0);
            });
        } else {
            // Render immediately
            canvas.width = result instanceof Image ? result.naturalWidth : result.width;
            canvas.height = result instanceof Image ? result.naturalHeight : result.height;
            context.drawImage(result, 0, 0);
        }
    }
}

function previewToPixelmap(): RGBAPixelMap {
    const w = canvas.width;
    const imgData = context.getImageData(0, 0, w, canvas.height);
    const data = imgData.data;
    const map = new ColorMap(w, canvas.height, (x, y) => {
        const p = 4 * (x + y * w);
        return [ data[p], data[p + 1], data[p + 2], data[p + 3] ];
    });
    return map;
}

function prepareWindowScope() {
    exposeToWindow({
        width: canvas.width,
        height: canvas.height,
    });
}

function displayError(e: any) {
    console.error(e);
}