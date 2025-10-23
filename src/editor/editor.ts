import { GrayscalePixelMap, RGBAPixelMap, ColorMap, isConstructingPixelmap } from "../image-lib";
import { PixelMap } from "../PixelMap";
import { perlin2D, fractalPerlin2D } from "../utility/perlin";
import { createElement, exposeToWindow, removeNonStandardCharacters } from "../demo/util";
import { examples } from "./examples";
import { SmartStorage } from "../storage/SmartStorage";
import { LoginWidget } from "../demo/LoginWidget";
import { QuotaWidget } from "../demo/QuotaWidget";
import { clamp, getRangeMapper, mapRange } from "../utility/util";
import { api, applyImage, generatorSize, initCanvases, initSlotUsage, sourceCanvas, targetCanvas, wrapCanvasInPixelMap, wrapImageInPixelMap } from "./editingApi";
import { setupDocumentation } from "./documentation";
import { ParameterHandler } from "./parameters";
import { getShareUrl, parseScriptParam, setScriptParam, clearScriptParam, ScriptCategory } from "./share";
import { markScriptLoaded, markScriptStarted, setupInteraction } from "./interaction";
import { ColorPicker } from "./ColorPicker";
import publicExamples from "./public_examples.json";
import ColorGradient from "../utility/ColorGradient";
import { createAutoColorGradient } from "../utility/AutoColorGradient";

/*
    Developer Notes
    - This file defines the primary editor UI and the file tree with three sections: User, Public, Examples.
    - User snippets are persisted via SmartStorage. We keep a Set snippetNames synchronized with storage.
    - Read-only sources (Public/Examples) display a bottom-centered "Make a Copy" button that creates a User copy.
    - Autosave is debounced while editing User snippets. A dirty marker (*) is shown next to the active title.
*/

let editor: HTMLTextAreaElement;
let sourceContext, targetContext: CanvasRenderingContext2D;
let loginWidget: LoginWidget;
let quotaWidget: QuotaWidget;
let fileTreeToggleButton: HTMLButtonElement;
// Track the currently selected row in the file tree for visual highlighting
let selectedRow: HTMLElement | null = null;

let currentUserCodeName: string | null = null;
let currentScriptOrigin: 'user' | 'examples' | 'public' = 'user';
// Title helper
function setEditorTitle(origin: 'user'|'public'|'examples', name: string) {
    const readable = name.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const originReadable = origin === 'user' ? 'User script' : (origin === 'public' ? 'Public script' : 'Example');
    document.title = `Image Editor - ${originReadable} - ${readable}`;
    // Update in-page title
    const h1 = document.getElementById('current-script-title');
    if (h1) {
        h1.textContent = readable;
        h1.classList.remove('hidden');
    }
}

let isDirty = false;
let userCodes: Record<string, string> = {};
const persistentStorage = new SmartStorage();

const INITIAL_USER_CODE = `copy();

// Your code here`;
let imageSlots: (HTMLImageElement | HTMLCanvasElement)[] = [];

let parameterHandler: ParameterHandler;
let parameterUpdateCalls = 0;

const SNIPPET_NAMES_KEY = 'snippetNames';
const SNIPPET_KEY_PREFIX = 'snippet___';
// Track known snippet names from storage; do not lose existing entries on save
let snippetNames = new Set<string>();

window.addEventListener('load', async () => {
    editor = document.getElementById("editor-textarea") as HTMLTextAreaElement;
    initCanvases(
        document.getElementById("source-canvas") as HTMLCanvasElement,
        document.getElementById("target-canvas") as HTMLCanvasElement
    );
    initSlotUsage(
        getImageFromSlot,
        storeImageInSlot,
    );
    // Ensure one initial empty slot is rendered at startup
    updateImageSlots();
    sourceContext = sourceCanvas.getContext("2d");
    targetContext = targetCanvas.getContext("2d");

    loginWidget = new LoginWidget(document.body, persistentStorage);

    setupDocumentation(document.querySelector(".help-overlay"));
    setupInteraction(targetCanvas);

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
        new ColorPicker(),
    );

    const docuModeButton = document.querySelector("#editor-docu-toggle") as HTMLButtonElement;
    docuModeButton.addEventListener("click", () => {
        toggleDocuMode();
    });

    fileTreeToggleButton = document.getElementById('file-tree-toggle') as HTMLButtonElement;
    fileTreeToggleButton.addEventListener('click', () => {
        toggleFileTree();
    });
    // Restore sidebar open/closed state from localStorage (default: open)
    const remembered = localStorage.getItem('fileTreeOpen');
    if (remembered === 'false') {
        toggleFileTree(false);
    } else {
        toggleFileTree(true);
    }

    exposeToWindow(api);
    exposeToWindow({param: parameterHandler});

    exposeToWindow({
        sourceCanvas,
        targetCanvas,
        context: targetContext,
        targetContext,
        canvas: targetCanvas,
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
        ColorGradient,
        createAutoColorGradient,
    });

    await buildFileTree();
    // Attach QuotaWidget to a fixed footer inside the side panel
    quotaWidget = new QuotaWidget(document.querySelector('#file-tree-footer'), persistentStorage);
    prepareTextarea();

    // Deep-linking: ?script=<category>/<name> (legacy ?load is auto-migrated)
    await applyDeepLinkFromUrl(true);

    // Support back/forward navigation without reload
    window.addEventListener('popstate', async () => {
        await applyDeepLinkFromUrl(false);
    });
});

function markDirty(dirty: boolean) {
    isDirty = dirty;
    updateTreeDirtyMarker();
}

function updateTreeDirtyMarker() {
    if (currentScriptOrigin !== 'user' && currentUserCodeName) return;
    const el = document.querySelector(`[data-user-script="${cssEscape(currentUserCodeName || '')}"] .title`);
    if (el) {
        el.textContent = currentUserCodeName + (isDirty ? ' *' : '');
    }
}

function cssEscape(s: string) { return s.replace(/"/g, '\\"'); }

function prepareTextarea() {
    editor.addEventListener('input', () => {
        if (currentScriptOrigin === 'user') {
            markDirty(true);
            clearTimeout((prepareTextarea as any)._t);
            (prepareTextarea as any)._t = setTimeout(() => {
                saveCurrentSnippet();
                markDirty(false);
            }, 800);
        }
    });
    editor.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            runCode();
        }
    });
}

async function buildFileTree() {
    const root = document.getElementById('file-tree-list');
    root.innerHTML = '';

    const userSection = createSection(root, 'User', true);
    const publicSection = createSection(root, 'Public', true);
    const examplesSection = createSection(root, 'Examples', true);

    const snippetTitlesStr = await persistentStorage.getValue(SNIPPET_NAMES_KEY);
    let titles: string[] = [];
    if (snippetTitlesStr) {
        try { titles = JSON.parse(snippetTitlesStr); } catch {}
    }
    titles.sort((a,b) => a.localeCompare(b));
    snippetNames = new Set(titles);
    for (const name of titles) {
        addUserItem(userSection.body, name);
    }

    for (const name of publicExamples as string[]) {
        addPublicItem(publicSection.body, name);
    }

    for (const name of Object.keys(examples).sort((a,b)=>a.localeCompare(b))) {
        addExampleItem(examplesSection.body, name);
    }

    const newBtn = document.createElement('button');
    newBtn.title = 'New Snippet';
    newBtn.textContent = '+';
    newBtn.className = 'add-btn';
    newBtn.onclick = async (e) => {
        e.stopPropagation(); // do not toggle the section
        // Ensure the User section stays open
        userSection.body.style.display = 'block';
        userSection.toggle.textContent = '▾';
        const name = createNewSnippet();
        if (name) {
            addUserItem(userSection.body, name);
            await selectUserScript(name);
            setScriptParam('user', name);
        }
    };
    userSection.header.appendChild(newBtn);
}

function createSection(parent: HTMLElement, title: string, open = true) {
    const container = document.createElement('div');
    const header = document.createElement('div');
    header.className = 'tree-section-header';
    const toggle = document.createElement('span');
    toggle.className = 'arrow';
    toggle.textContent = open ? '▾' : '▸';
    const label = document.createElement('span');
    label.textContent = title;
    header.appendChild(toggle); header.appendChild(label);
    const body = document.createElement('div');
    body.style.display = open ? 'block' : 'none';
    header.onclick = () => {
        const isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : 'block';
        toggle.textContent = isOpen ? '▸' : '▾';
    };
    container.appendChild(header); container.appendChild(body);
    parent.appendChild(container);
    return {container, header, body, toggle};
}

function setSelectedRow(row: HTMLElement) {
    if (selectedRow && selectedRow !== row) selectedRow.classList.remove('selected');
    selectedRow = row;
    row.classList.add('selected');
}

function addUserItem(parent: HTMLElement, name: string) {
    const row = document.createElement('div');
    row.className = 'tree-item';
    row.dataset.userScript = name;
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = name;
    const del = document.createElement('button');
    del.className = 'trash';
    del.title = 'Delete';
    del.textContent = '🗑️';
    del.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Delete snippet "${name}"?`)) {
            deleteSnippet(name);
            row.remove();
            if (selectedRow === row) selectedRow = null;
        }
    };
    row.onclick = async () => {
        setSelectedRow(row);
        await selectUserScript(name);
        setScriptParam('user', name);
    };
    row.appendChild(title); row.appendChild(del);
    parent.appendChild(row);
}

function addPublicItem(parent: HTMLElement, name: string) {
    const row = document.createElement('div');
    row.className = 'tree-item';
    row.onclick = async () => {
        setSelectedRow(row);
        currentScriptOrigin = 'public';
        currentUserCodeName = null;
        const url = getShareUrl(name);
        const res = await fetch(url);
        const code = await res.text();
        setEditorReadOnly(true, name, code);
        setEditorTitle('public', name);
        setScriptParam('public', name);
    };
    row.textContent = name;
    parent.appendChild(row);
}

function addExampleItem(parent: HTMLElement, name: string) {
    const row = document.createElement('div');
    row.className = 'tree-item';
    row.onclick = () => {
        setSelectedRow(row);
        currentScriptOrigin = 'examples';
        currentUserCodeName = null;
        const code = examples[name];
        setEditorReadOnly(true, name, code);
        setEditorTitle('examples', name);
        setScriptParam('examples', name);
    };
    row.textContent = name;
    parent.appendChild(row);
}

function setEditorReadOnly(readOnly: boolean, title: string, code: string) {
    setEditorText(code);
    editor.readOnly = readOnly;
    const existing = document.getElementById('make-copy-btn');
    if (existing) existing.remove();
    if (readOnly) {
        const btn = document.createElement('button');
        btn.id = 'make-copy-btn';
        btn.textContent = 'Make a Copy';
        btn.style.position = 'absolute';
        btn.style.left = '50%';
        btn.style.transform = 'translateX(-50%)';
        btn.style.bottom = '8px';
        btn.style.zIndex = '4';
        btn.onclick = () => {
            const newName = createUniqueUserName(title);
            userCodes[newName] = code;
            snippetNames.add(newName);
            saveSnippetNames();
            saveSnippet(newName);
            selectUserScript(newName);
            setScriptParam('user', newName);
        };
        (document.getElementById('editor-text') as HTMLElement).appendChild(btn);
    }
}

function createUniqueUserName(base: string) {
    let name = base;
    let i = 1;
    while (userCodes[name] || snippetNames.has(name)) name = `${base}-${i++}`;
    return name;
}

async function selectUserScript(name: string) {
    currentScriptOrigin = 'user';
    currentUserCodeName = name;
    const stored = await persistentStorage.getValue(SNIPPET_KEY_PREFIX + name);
    const code = userCodes[name] || stored || INITIAL_USER_CODE;
    setEditorText(code);
    editor.readOnly = false;
    const copyBtn = document.getElementById('make-copy-btn');
    if (copyBtn) copyBtn.remove();
    // Highlight the corresponding row when selection is triggered programmatically
    const row = document.querySelector(`[data-user-script="${cssEscape(name)}"]`) as HTMLElement | null;
    if (row) setSelectedRow(row);
    setEditorTitle('user', name);
    markDirty(false);
}

function saveSnippetNames() {
    const names = new Set<string>(snippetNames);
    for (const k of Object.keys(userCodes)) names.add(k);
    persistentStorage.setValue(SNIPPET_NAMES_KEY, JSON.stringify(Array.from(names).sort((a,b)=>a.localeCompare(b))));
}

function saveSnippet(key: string) {
    if (userCodes[key]) {
        persistentStorage.setValue(SNIPPET_KEY_PREFIX + key, userCodes[key]);
    }
}

function saveCurrentSnippet() {
    if (currentUserCodeName) {
        userCodes[currentUserCodeName] = editor.value;
        snippetNames.add(currentUserCodeName);
        saveSnippet(currentUserCodeName);
        saveSnippetNames();
    }
}

function deleteSnippet(key: string) {
    delete userCodes[key];
    snippetNames.delete(key);
    persistentStorage.deleteValue(SNIPPET_KEY_PREFIX + key);
    saveSnippetNames();
}

function storeImageInSlot<T>(img: HTMLImageElement | HTMLCanvasElement | PixelMap<T>, id?: number) {
    const image = img instanceof PixelMap ? img.toImage() : img;
    if (!image || !(image instanceof HTMLImageElement || image instanceof HTMLCanvasElement)) {
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
    return id;
}

function getImageFromSlot(index: number): HTMLImageElement | HTMLCanvasElement | null {
    return imageSlots[index] ?? null;
}

function getPixelMapFromSlot(index: number): RGBAPixelMap | null {
    const img = getImageFromSlot(index);
    if (img) {
        if (img instanceof HTMLImageElement) {
            return wrapImageInPixelMap(img);
        } else {
            return wrapCanvasInPixelMap(img);
        }
    }
    return null
}

function updateImageSlots() {
    const container = document.getElementById("image-slots");
    container.innerHTML = "";
    for (let i = 0; i <= imageSlots.length; i++) {
        const el = createElement("div", "image-slots-preview checkerboard", null, container);
        if (imageSlots[i]) {
            const img = createElement("img", "", "", el) as HTMLImageElement;
            const slotImg = imageSlots[i];
            const src = slotImg instanceof HTMLImageElement ? slotImg.src : slotImg.toDataURL();
            img.src = src;
        }
        createElement("span", "", `${i + 1}`, el);
        (el as any).storageIndex = i;
        // Wire drop to store image into the chosen slot
        turnIntoImageDropTarget(el, (img, fieldId) => storeImageInSlot(img, fieldId), console.error);
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
    if (!name || name in userCodes || snippetNames.has(name)) {
        if (name) {
            alert("Name '" + name + "' already taken! Please try again with a different name.");
        }
        return null;
    } else {
        currentUserCodeName = name;
        userCodes[name] = "// *** " + name + " ***\n" + INITIAL_USER_CODE;
        snippetNames.add(name);
        setEditorText(userCodes[name]);
        saveSnippetNames();
        return name;
    }
}

function runCode() {
    const code = editor.value ?? "";
    try {
        const t0 = Date.now();
        applyDocuContentFromCode(code);
        prepareWindowScope();
        markScriptStarted();
        api.setFrameHandler(null);
        let prevParamUpdates = parameterHandler.getTotalCalls();
        sourceContext.save();
        targetContext.save();
        const fnc = new Function(code);
        api.use();
        const result = fnc();
        if (result) {
            applyImage(targetCanvas, -1);
        }
        sourceContext.restore();
        targetContext.restore();
        if (prevParamUpdates === parameterHandler.getTotalCalls()) {
            parameterHandler.sync();
        }
        const duration = Date.now() - t0;
        displayDuration(duration);
    } catch(e) {
        displayError(e);
    }
}

function displayDuration(duration: number): void {
    console.log("Code execution took", duration, "ms");
}

function applyDocuContentFromCode(code: string = editor.value) {
    const lines = (code ?? "").split('\n').map(l => l.trim());
    const docuLines = lines.filter(l => l.startsWith("//>"));
    const docuContent = docuLines.map(l => l.substring(3).trim());
    const docuContainer = document.querySelector("#editor-docu");
    docuContainer.innerHTML = "";
    if (docuContent.length === 0) {
        docuContainer.classList.add("docu-empty-state");
        docuContent.push("No documentation provided.");
        docuContent.push("Add documentation using //> in your code.");
    } else {
        docuContainer.classList.remove("docu-empty-state");
    }
    docuContent.forEach(line => {
        const p = document.createElement("p");
        p.textContent = line;
        docuContainer.appendChild(p);
    });
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
    div.addEventListener("dragover", (event) => {
        event.preventDefault();
        div.classList.add("drop-target");
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
            clearDropOverlay();
        }
    });
  
    div.addEventListener("drop", (event) => {
        event.preventDefault();
        const file = (event as DragEvent).dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            const img = new Image();
            const reader = new FileReader();
            const fieldId = extraContainer ? Array.from(extraContainer.children).indexOf(event.target as HTMLElement) : -1;
            reader.addEventListener("load", () => {
                img.addEventListener("load", () => handleImage(img, fieldId, event.target));
                img.addEventListener("error", (error: ErrorEvent) => handleError(error));
                img.src = reader.result as string;
            });
            reader.readAsDataURL(file);
        }
        clearDropOverlay();
    });

    function clearDropOverlay() {
        div.classList.remove("drop-target");
        extraContainer?.remove();
        extraContainer = null;
    }
}

function toggleDocuMode(docuMode = !document.body.classList.contains("docu-mode")) {
    if (docuMode) {
        applyDocuContentFromCode();
        document.body.classList.add("docu-mode");
    } else {
        document.body.classList.remove("docu-mode");
    }
}

let fileTreeOpen = true;
function toggleFileTree(enabled = !fileTreeOpen) {
    fileTreeOpen = enabled;
    const container = document.getElementById('file-tree-container');
    if (enabled) {
        container.classList.remove('collapsed');
    } else {
        container.classList.add('collapsed');
    }
    try { localStorage.setItem('fileTreeOpen', String(fileTreeOpen)); } catch {}
}

async function applyDeepLinkFromUrl(replaceOnSuccess: boolean) {
    const info = parseScriptParam();
    if (!info) return;
    const { category, name } = info;
    // Try to find and open matching script
    try {
        if (category === 'user') {
            // Verify it exists in storage; if not, alert and clear param
            const stored = await persistentStorage.getValue(SNIPPET_KEY_PREFIX + name);
            if (!stored && !snippetNames.has(name)) throw new Error('not found');
            // Ensure it exists in the UI
            if (!document.querySelector(`[data-user-script="${cssEscape(name)}"]`)) {
                const userSectionBody = document.querySelector('#file-tree-list')!.children[0].children[1] as HTMLElement; // User section body
                addUserItem(userSectionBody, name);
            }
            await selectUserScript(name);
            if (replaceOnSuccess) setScriptParam('user', name, true);
            toggleDocuMode(true);
            return;
        }
        if (category === 'public') {
            // Try to select an existing Public row
            const publicRows = Array.from(document.querySelectorAll('#file-tree-list .tree-item')) as HTMLElement[];
            const row = publicRows.find(r => r.parentElement?.previousSibling &&
                (r.parentElement.previousSibling as HTMLElement).textContent?.includes('Public') && r.textContent?.trim() === name);
            if (row) {
                setSelectedRow(row as HTMLElement);
                currentScriptOrigin = 'public';
                currentUserCodeName = null;
                const url = getShareUrl(name);
                const res = await fetch(url);
                const code = await res.text();
                setEditorReadOnly(true, name, code);
                setEditorTitle('public', name);
                if (replaceOnSuccess) setScriptParam('public', name, true);
                toggleDocuMode(true);
                return;
            }
            // Fallback: fetch and show read-only if not found in list
            currentScriptOrigin = 'public';
            currentUserCodeName = null;
            const url = getShareUrl(name);
            const res = await fetch(url);
            if (!res.ok) throw new Error('not found');
            const code = await res.text();
            setEditorReadOnly(true, name, code);
            setEditorTitle('public', name);
            if (replaceOnSuccess) setScriptParam('public', name, true);
            toggleDocuMode(true);
            return;
        }
        if (category === 'examples') {
            if (examples[name]) {
                currentScriptOrigin = 'examples';
                currentUserCodeName = null;
                const code = examples[name];
                setEditorReadOnly(true, name, code);
                setEditorTitle('examples', name);
                if (replaceOnSuccess) setScriptParam('examples', name, true);
                toggleDocuMode(true);
                return;
            } else {
                throw new Error('not found');
            }
        }
    } catch (e) {
        alert(`Script '${name}' could not be found`);
        clearScriptParam();
    }
}