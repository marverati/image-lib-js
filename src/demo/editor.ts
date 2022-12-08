import { GrayscalePixelMap, RGBAPixelMap, ColorMap, PixelMap } from "../image-lib"
import { exposeToWindow } from "./util";
import { examples } from "./examples";

let editor: HTMLTextAreaElement;
let canvas: HTMLCanvasElement;
let context: CanvasRenderingContext2D;

// TODO: provide gen and filter in window scope

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
    })

    addExamples();
    prepareTextarea();
});

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
        const codeResult = fnc();
        const result = codeResult instanceof PixelMap ? codeResult.toImage() : codeResult;
        if (result) {
            // Render result into preview canvas if necessary
            if (result instanceof Image || (result instanceof HTMLCanvasElement && result !== canvas)) {
                if (result instanceof Image && result.naturalWidth === 0) {
                    // Wait for image to load
                    result.addEventListener('load', () => {
                        canvas.width = result.naturalWidth;
                        canvas.height = result.naturalHeight;
                        context.drawImage(result, 0, 0);
                    });
                } else {
                    // Render immediately
                    canvas.width = result instanceof Image ? result.naturalWidth : result.width;
                    canvas.height = result instanceof Image ? result.naturalHeight : result.height;
                    context.drawImage(result, 0, 0);
                }
            }
        }
    } catch(e) {
        displayError(e);
    }
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