import { GrayscalePixelMap, RGBAPixelMap, ColorMap, Colorizable, isConstructingPixelmap } from "../image-lib";
import { ImageGenerator, ImageFilter, ImageChannelFilter, Color, PixelMap } from "../PixelMap";
import { perlin2D, fractalPerlin2D } from "../utility/perlin";
import { createElement, exposeToWindow, removeNonStandardCharacters } from "../demo/util";
import { examples } from "./examples";
import { SmartStorage } from "../storage/SmartStorage";
import { LoginWidget } from "../demo/LoginWidget";
import { QuotaWidget } from "../demo/QuotaWidget";
import { clamp, getRangeMapper, mapRange } from "../utility/util";
import { api, applyImage, generatorSize, initCanvases, initSlotUsage, sourceCanvas, targetCanvas, wrapImageInPixelMap } from "./editingApi";
import { setupDocumentation } from "./documentation";
import { ParameterHandler } from "./parameters";
import { readAndApplyShareUrlIfSet } from "./share";

let editor: HTMLTextAreaElement;
let sourceContext, targetContext: CanvasRenderingContext2D;
let loginWidget: LoginWidget;
let quotaWidget: QuotaWidget;

let currentUserCodeName: string | null = null;
let userCodes: Record<string, string> = {};
const persistentStorage = new SmartStorage();

const INITIAL_USER_CODE = `applySourceToTarget();

// Your code here`
let imageSlots: HTMLImageElement[] = [];

let parameterHandler: ParameterHandler;
let parameterUpdateCalls = 0;

const SNIPPET_NAMES_KEY = 'snippetNames';
const SNIPPET_KEY_PREFIX = 'snippet___';

window.addEventListener('load', () => {
    editor = document.getElementById("editor-text") as HTMLTextAreaElement;
    initCanvases(
        document.getElementById("source-canvas") as HTMLCanvasElement,
        document.getElementById("target-canvas") as HTMLCanvasElement
    );
    initSlotUsage(
        getImageFromSlot,
        storeImageInSlot,
    );
    sourceContext = sourceCanvas.getContext("2d");
    targetContext = targetCanvas.getContext("2d");

    loginWidget = new LoginWidget(document.body, persistentStorage);

    setupDocumentation(document.querySelector(".help-overlay"));

    const paramContent = document.querySelector("#parameter-content") as HTMLElement;
    const paramEmpty = document.querySelector("#parameter-empty-state") as HTMLElement;
    parameterHandler = new ParameterHandler(
        paramContent,
        () => {
            runCode();
        },
        () => {
            parameterUpdateCalls += 1;
            const hasContent = paramContent.textContent.trim().length > 0;
            paramContent.style.display = hasContent ? "block" : "none";
            paramEmpty.style.display = hasContent ? "none" : "block";
        },
    );

    exposeToWindow(api);
    exposeToWindow({param: parameterHandler});

    // For our code snippets to work as a function based on raw text, we need to add classes to window scope
    exposeToWindow({
        sourceCanvas,
        targetCanvas,
        context: targetContext,
        targetContext,
        sourceContext,
        persistentStorage,
        saveCurrentSnippet,
        GrayscalePixelMap,
        RGBAPixelMap,
        ColorMap,
        wrap: wrapImageInPixelMap,
        getStored: getPixelMapFromSlot,
        getStoredImage: getImageFromSlot,
        perlin2D,
        fractalPerlin2D,
        clamp,
        mapRange,
        getRangeMapper,
    })

    addExamples();
    quotaWidget = new QuotaWidget(document.querySelector("#example-container"), persistentStorage);
    prepareTextarea();

    // Allow dropping images to load
    turnIntoImageDropTarget(document.body, (img, _fieldId, target) => {
        if (target instanceof HTMLElement && ((target as any).storageIndex >= 0 || (target.parentElement as any).storageIndex >= 0)) {
            // Load to storage
            const index = (target as any).storageIndex ?? (target.parentElement as any).storageIndex;
            storeImageInSlot(img, +index);
        } else {
            // As main picture
            applyImage(img, 0);
        }
    }, console.error);
    updateImageSlots();

    // Load code from URL-provided deep link if set
    readAndApplyShareUrlIfSet().then((code) => {
        if (code) {
            setEditorText(code);
        }
    }).catch(console.error);
});

function storeImageInSlot<T>(img: HTMLImageElement | PixelMap<T>, id?: number) {
    const image = img instanceof PixelMap ? img.toImage() : img;
    if (!image || !(image instanceof HTMLImageElement)) {
        console.error("Invalid image: ", img);
        return;
    }
    if (id == null || id < 0) {
        id = imageSlots.findIndex(v => v == null);
        if (id < 0) {
            id = imageSlots.length;
        }
    }
    imageSlots[id] = image;
    updateImageSlots();
}

function getImageFromSlot(index: number): HTMLImageElement | null {
    return imageSlots[index - 1] ?? null;
}

function getPixelMapFromSlot(index: number): RGBAPixelMap | null {
    const img = getImageFromSlot(index);
    if (img) {
        return wrapImageInPixelMap(img);
    }
    return null
}

function updateImageSlots() {
    const container = document.getElementById("image-slots");
    container.innerHTML = "";
    for (let i = 0; i <= imageSlots.length; i++) { // go one index further, to always show one empty option for user to drop image into
        const el = createElement("div", "image-slots-preview checkerboard", null, container);
        if (imageSlots[i]) {
            const img = createElement("img", "", "", el) as HTMLImageElement;
            img.src = imageSlots[i].src;
        }
        createElement("span", "", `${i + 1}`, el);
        (el as any).storageIndex = i;
        turnIntoImageDropTarget(el, () => {}, console.error);
    }
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
        // Check quota and avoid creating new snippet if quota is reached
        if (quotaWidget.getVisibleQuota() >= 1) {
            alert("You have reached your storage quota. Please delete some of your snippets before creating new ones.");
            return;
        }
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
    const snippetTitles = await persistentStorage.getValue(SNIPPET_NAMES_KEY);
    if (snippetTitles) {
        try {
            const codeNames = JSON.parse(snippetTitles);
            userCodes = {}
            for (const name of codeNames) {
                // TODO: load individual snippets lazily rather than all at once
                const code = await persistentStorage.getValue(SNIPPET_KEY_PREFIX + name);
                userCodes[name] = code;
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
        saveSnippetNames();
        return name;
    }
}

function saveSnippetNames() {
    persistentStorage.setValue(SNIPPET_NAMES_KEY, JSON.stringify(Object.keys(userCodes)));
}

function saveCurrentSnippet() {
    if (currentUserCodeName) {
        userCodes[currentUserCodeName] = getEditorText();
        saveSnippet(currentUserCodeName);
    }
}

function saveAllSnippets() {
    persistentStorage.setValue(SNIPPET_NAMES_KEY, JSON.stringify(Object.keys(userCodes)));
    for (const key in userCodes) {
        persistentStorage.setValue(SNIPPET_KEY_PREFIX + key, userCodes[key]);
    }
    quotaWidget.render();
}

function saveSnippet(key: string) {
    if (userCodes[key]) {
        persistentStorage.setValue(SNIPPET_KEY_PREFIX + key, userCodes[key]);
    }
}

function deleteSnippet(key: string) {
    delete userCodes[key];
    persistentStorage.deleteValue(SNIPPET_KEY_PREFIX + key);
}

function runCode() {
    const code = editor.value;
    try {
        prepareWindowScope();
        let prevParamUpdates = parameterHandler.getTotalCalls();
        const fnc = new Function(code);
        const result = fnc();
        if (result) {
            applyImage(targetCanvas, -1);
        }
        if (prevParamUpdates === parameterHandler.getTotalCalls()) {
            // If no parameters were used, clear paramter div
            parameterHandler.sync();
        }
    } catch(e) {
        displayError(e);
    }
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
        if (event.target === div) {
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
