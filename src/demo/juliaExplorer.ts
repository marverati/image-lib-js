import { get } from "http";
import { ImageLib, RGBAPixelMap } from "../image-lib";
import { createAutoColorGradient } from "../utility/AutoColorGradient";
import ColorGradient from "../utility/ColorGradient";
import { Random } from "../utility/Random";

const ITERATIONS = 256;
const ITERATIONS_HD = 1024;
const ITERATIONS_UHD = 2048;
const SIZE_LOW = 256;
const SIZE_HIGH = 512;
const SIZE_HD = 1024;
const SIZE_UHD = 1536;

// State management
interface JuliaParams {
    centerReal: number;
    centerImag: number;
    stdev: number;
    colorSeed: number;
    variationSeed: number;
}

interface GridItem {
    real: number;
    imag: number;
    isCenter: boolean;
}

let currentParams: JuliaParams = {
    centerReal: 0,
    centerImag: 0,
    stdev: 1,
    colorSeed: 0,
    variationSeed: 0,
};

let history: JuliaParams[] = [];
let historyIndex = -1;

let gridItems: GridItem[] = [];
let colorGradient: ColorGradient;
let isRendering = false;
let abortRendering = false;

// DOM elements
let gridContainer: HTMLElement;
let colorSeedInput: HTMLInputElement;
let variationSeedInput: HTMLInputElement;
let centerDisplay: HTMLElement;
let stdevDisplay: HTMLElement;
let backBtn: HTMLAnchorElement;
let forwardBtn: HTMLAnchorElement;
let zoomInBtn: HTMLAnchorElement;
let zoomOutBtn: HTMLAnchorElement;
let renderHdBtn: HTMLAnchorElement;
let renderUhdBtn: HTMLAnchorElement;
let resetBtn: HTMLAnchorElement;
let overlay: HTMLElement;
let overlayCanvas: HTMLCanvasElement;
let overlayClose: HTMLElement;
let statusElement: HTMLElement;

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    initializeDOM();
    loadParamsFromURL();
    updateColorGradient();
    saveToHistory();
    renderGrid();
    checkForAutoActions();
});

function initializeDOM() {
    gridContainer = document.getElementById('grid')!;
    colorSeedInput = document.getElementById('colorSeed') as HTMLInputElement;
    variationSeedInput = document.getElementById('variationSeed') as HTMLInputElement;
    centerDisplay = document.getElementById('centerDisplay')!;
    stdevDisplay = document.getElementById('stdevDisplay')!;
    backBtn = document.getElementById('backBtn') as HTMLAnchorElement;
    forwardBtn = document.getElementById('forwardBtn') as HTMLAnchorElement;
    zoomInBtn = document.getElementById('zoomInBtn') as HTMLAnchorElement;
    zoomOutBtn = document.getElementById('zoomOutBtn') as HTMLAnchorElement;
    renderHdBtn = document.getElementById('renderHdBtn') as HTMLAnchorElement;
    renderUhdBtn = document.getElementById('renderUhdBtn') as HTMLAnchorElement;
    resetBtn = document.getElementById('resetBtn') as HTMLAnchorElement;
    overlay = document.getElementById('overlay')!;
    overlayCanvas = document.getElementById('overlayCanvas') as HTMLCanvasElement;
    overlayClose = document.getElementById('overlayClose')!;
    statusElement = document.getElementById('status')!;

    // Event listeners
    colorSeedInput.addEventListener('change', onColorSeedChange);
    variationSeedInput.addEventListener('change', onVariationSeedChange);
    backBtn.addEventListener('click', (e) => { e.preventDefault(); goBack(); });
    forwardBtn.addEventListener('click', (e) => { e.preventDefault(); goForward(); });
    zoomInBtn.addEventListener('click', (e) => { e.preventDefault(); zoomIn(); });
    zoomOutBtn.addEventListener('click', (e) => { e.preventDefault(); zoomOut(); });
    renderHdBtn.addEventListener('click', (e) => { e.preventDefault(); renderHD(SIZE_HD); });
    renderUhdBtn.addEventListener('click', (e) => { e.preventDefault(); renderHD(SIZE_UHD); });
    resetBtn.addEventListener('click', (e) => { e.preventDefault(); reset(); });
    overlayClose.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeOverlay();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeOverlay();
        } else if (e.key === 'ArrowLeft' || e.key === 'h') {
            goBack();
        } else if (e.key === 'ArrowRight' || e.key === 'l') {
            goForward();
        } else if (e.key === '+' || e.key === '=') {
            zoomIn();
        } else if (e.key === '-') {
            zoomOut();
        } else if (e.key === 'r') {
            reset();
        } else if (e.key === 'c' || e.key === 'C') {
            currentParams.colorSeed++;
            colorSeedInput.value = currentParams.colorSeed.toString();
            onColorSeedChange();
        } else if (e.key === 'v' || e.key === 'V') {
            currentParams.variationSeed++;
            variationSeedInput.value = currentParams.variationSeed.toString();
            onVariationSeedChange();
        }
    });

    // Create grid items
    for (let i = 0; i < 9; i++) {
        const a = document.createElement('a');
        a.className = 'grid-item';
        a.href = '#';
        if (i === 4) a.classList.add('center');
        a.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
        a.addEventListener('click', (e) => { e.preventDefault(); onGridItemClick(i); });
        gridContainer.appendChild(a);
    }
}

function loadParamsFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('cr')) {
        currentParams.centerReal = parseFloat(params.get('cr')!);
    }
    if (params.has('ci')) {
        currentParams.centerImag = parseFloat(params.get('ci')!);
    }
    if (params.has('sd')) {
        currentParams.stdev = parseFloat(params.get('sd')!);
    }
    if (params.has('cs')) {
        currentParams.colorSeed = parseInt(params.get('cs')!);
    }
    if (params.has('vs')) {
        currentParams.variationSeed = parseInt(params.get('vs')!);
    }

    colorSeedInput.value = currentParams.colorSeed.toString();
    variationSeedInput.value = currentParams.variationSeed.toString();
    updateDisplay();
}

function checkForAutoActions() {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    
    if (action === 'renderHD') {
        // Wait a bit for grid to render first
        setTimeout(() => renderHD(SIZE_HD), 1000);
    } else if (action === 'renderUHD') {
        setTimeout(() => renderHD(SIZE_UHD), 1000);
    }
}

function updateURL() {
    const params = new URLSearchParams();
    params.set('cr', currentParams.centerReal.toFixed(6));
    params.set('ci', currentParams.centerImag.toFixed(6));
    params.set('sd', currentParams.stdev.toFixed(6));
    params.set('cs', currentParams.colorSeed.toString());
    params.set('vs', currentParams.variationSeed.toString());
    
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, '', newURL);
    updateButtonURLs();
}

function buildURL(overrides: Partial<JuliaParams> = {}, action?: string): string {
    const params = new URLSearchParams();
    const p = { ...currentParams, ...overrides };
    params.set('cr', p.centerReal.toFixed(6));
    params.set('ci', p.centerImag.toFixed(6));
    params.set('sd', p.stdev.toFixed(6));
    params.set('cs', p.colorSeed.toString());
    params.set('vs', p.variationSeed.toString());
    if (action) params.set('action', action);
    return `${window.location.pathname}?${params.toString()}`;
}

function updateButtonURLs() {
    // Update href attributes for all action buttons
    if (historyIndex > 0) {
        backBtn.href = buildURL(history[historyIndex - 1]);
    } else {
        backBtn.href = '#';
    }
    
    if (historyIndex < history.length - 1) {
        forwardBtn.href = buildURL(history[historyIndex + 1]);
    } else {
        forwardBtn.href = '#';
    }
    
    zoomInBtn.href = buildURL({ stdev: currentParams.stdev * 0.5, variationSeed: currentParams.variationSeed + 1 });
    zoomOutBtn.href = buildURL({ stdev: currentParams.stdev * 2, variationSeed: currentParams.variationSeed + 1 });
    renderHdBtn.href = buildURL({}, 'renderHD');
    renderUhdBtn.href = buildURL({}, 'renderUHD');
    resetBtn.href = buildURL({ centerReal: 0, centerImag: 0, stdev: 1 });
    
    // Update grid item URLs
    for (let i = 0; i < 9; i++) {
        const a = gridContainer.children[i] as HTMLAnchorElement;
        if (gridItems[i]) {
            if (i === 4) {
                a.href = buildURL({ variationSeed: currentParams.variationSeed + 1 });
            } else {
                a.href = buildURL({ 
                    centerReal: gridItems[i].real, 
                    centerImag: gridItems[i].imag, 
                    stdev: currentParams.stdev * 0.75,
                    variationSeed: currentParams.variationSeed + 1 
                });
            }
        }
    }
}

function updateDisplay() {
    centerDisplay.textContent = `(${currentParams.centerReal.toFixed(3)}, ${currentParams.centerImag.toFixed(3)})`;
    stdevDisplay.textContent = currentParams.stdev.toFixed(3);
    colorSeedInput.value = currentParams.colorSeed.toString();
    variationSeedInput.value = currentParams.variationSeed.toString();
}

function updateColorGradient() {
    const initialColor = (currentParams.colorSeed % 2) ? [-1.5,-1.5,-1.5] as [number, number, number] : null;
    colorGradient = createAutoColorGradient(0.2, 0.4, 1000, initialColor, currentParams.colorSeed, false);
}

function saveToHistory() {
    // Remove any forward history
    history = history.slice(0, historyIndex + 1);
    
    // Add current state
    history.push({ ...currentParams });
    historyIndex = history.length - 1;
    
    updateHistoryButtons();
}

function updateHistoryButtons() {
    // For anchor elements, we use pointer-events and opacity to simulate disabled state
    if (historyIndex <= 0) {
        backBtn.style.pointerEvents = 'none';
        backBtn.style.opacity = '0.5';
    } else {
        backBtn.style.pointerEvents = '';
        backBtn.style.opacity = '';
    }
    
    if (historyIndex >= history.length - 1) {
        forwardBtn.style.pointerEvents = 'none';
        forwardBtn.style.opacity = '0.5';
    } else {
        forwardBtn.style.pointerEvents = '';
        forwardBtn.style.opacity = '';
    }
}

function goBack() {
    if (historyIndex > 0) {
        historyIndex--;
        currentParams = { ...history[historyIndex] };
        updateDisplay();
        updateURL();
        updateColorGradient();
        updateHistoryButtons();
        renderGrid();
    }
}

function goForward() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        currentParams = { ...history[historyIndex] };
        updateDisplay();
        updateURL();
        updateColorGradient();
        updateHistoryButtons();
        renderGrid();
    }
}

function onColorSeedChange() {
    const newSeed = parseInt(colorSeedInput.value);
    if (!isNaN(newSeed) && newSeed !== currentParams.colorSeed) {
        currentParams.colorSeed = newSeed;
        updateColorGradient();
        saveToHistory();
        updateURL();
        renderGrid();
    }
}

function onVariationSeedChange() {
    const newSeed = parseInt(variationSeedInput.value);
    if (!isNaN(newSeed) && newSeed !== currentParams.variationSeed) {
        currentParams.variationSeed = newSeed;
        saveToHistory();
        updateURL();
        renderGrid();
    }
}

function reset() {
    currentParams = {
        centerReal: 0,
        centerImag: 0,
        stdev: 1,
        colorSeed: Math.floor(Math.random() * 100000),
        variationSeed: Math.floor(Math.random() * 1000),
    };
    updateDisplay();
    updateColorGradient();
    saveToHistory();
    updateURL();
    renderGrid();
}

function onGridItemClick(index: number) {
    if (isRendering) return;

    if (index === 4) {
        // Center clicked - increment variation seed to re-randomize
        currentParams.variationSeed++;
        updateDisplay();
        saveToHistory();
        updateURL();
        renderGrid();
    } else {
        // Other item clicked - zoom in and increment variation seed
        const item = gridItems[index];
        currentParams.centerReal = item.real;
        currentParams.centerImag = item.imag;
        currentParams.stdev *= 0.75;
        currentParams.variationSeed++;
        
        updateDisplay();
        saveToHistory();
        updateURL();
        renderGrid();
    }
}

function zoomIn() {
    if (isRendering) return;
    
    currentParams.stdev *= 0.5;
    currentParams.variationSeed++;
    updateDisplay();
    saveToHistory();
    updateURL();
    renderGrid();
}

function zoomOut() {
    if (isRendering) return;
    
    currentParams.stdev *= 2;
    currentParams.variationSeed++;
    updateDisplay();
    saveToHistory();
    updateURL();
    renderGrid();
}

function generateGridPositions() {
    const rnd = new Random(currentParams.variationSeed);
    gridItems = [];

    for (let i = 0; i < 9; i++) {
        if (i === 4) {
            // Center item - use exact center point
            gridItems.push({
                real: currentParams.centerReal,
                imag: currentParams.centerImag,
                isCenter: true,
            });
        } else {
            // Other items - sample with gaussian distribution
            gridItems.push({
                real: currentParams.centerReal + rnd.gaussian(0, currentParams.stdev),
                imag: currentParams.centerImag + rnd.gaussian(0, currentParams.stdev),
                isCenter: false,
            });
        }
    }
}

async function renderGrid() {
    if (isRendering) {
        // Abort current rendering and start new one
        abortRendering = true;
        // Wait a bit for the abort to take effect
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    isRendering = true;
    abortRendering = false;
    const renderingId = Date.now(); // Unique ID for this rendering session
    
    generateGridPositions();
    
    // First pass: render all at low resolution
    statusElement.textContent = 'Rendering preview (256×256)...';
    const lowResPromises = gridItems.map((item, index) => 
        renderJuliaSet(item.real, item.imag, SIZE_LOW, ITERATIONS, index, renderingId)
    );
    await Promise.all(lowResPromises);
    
    // Check if we should abort
    if (abortRendering) {
        isRendering = false;
        return;
    }
    
    // Second pass: render all at high resolution
    statusElement.textContent = 'Rendering full quality (512×512)...';
    const highResPromises = gridItems.map((item, index) => 
        renderJuliaSet(item.real, item.imag, SIZE_HIGH, ITERATIONS, index, renderingId)
    );
    await Promise.all(highResPromises);
    
    // Check if we should abort
    if (abortRendering) {
        isRendering = false;
        return;
    }
    
    statusElement.textContent = '';
    isRendering = false;
    updateButtonURLs();
}

async function renderJuliaSet(
    cr: number, 
    ci: number, 
    size: number, 
    iterations: number, 
    gridIndex?: number, 
    renderingId?: number,
    onProgress?: (progress: number) => void
): Promise<RGBAPixelMap> {
    const outerBound = 1.6;
    const blackConvergence = (currentParams.colorSeed % 4) < 2;
    const colorization = getColorizationForSeed(currentParams.colorSeed);
    return new Promise((resolve) => {
        // Use setTimeout to allow UI to update
        setTimeout(() => {
            // Check if this rendering was aborted
            if (abortRendering) {
                resolve(null as any);
                return;
            }

            let totalMax = 0;
            // R = (1 + √(1 + 4|c|))/2
            const divergenceRadius = Math.min(2, (1 + Math.sqrt(1 + 4 * Math.sqrt(cr * cr + ci * ci))) / 2);
            const sqrDivergenceRadius = divergenceRadius * divergenceRadius;

            const map = ImageLib.generate((x, y) => {
                // Report progress every 10th row at the start of the row
                if (onProgress && x === 0 && y % 10 === 0) {
                    onProgress(y / size);
                }
                
                const randomizedIterations = iterations + Math.random() ** 2 * (ITERATIONS_UHD - iterations);
                // Map pixel space to [-2, 2]x[-2, 2] space
                let zr = (x - size / 2) / (size / 4) * outerBound / 2;
                let zi = (y - size / 2) / (size / 4) * outerBound / 2;
                let pr = zr;
                let pi = zi;
                let maxDist = 0;
                
                let i = 0;
                for (; i < randomizedIterations; i++) {
                    pr = zr;
                    pi = zi;
                    // Apply Julia formula: z = z^2 + c
                    zr = pr * pr - pi * pi + cr;
                    zi = 2 * pr * pi + ci;
                    const dist = zr * zr + zi * zi;
                    if (dist > sqrDivergenceRadius) {
                        break;
                    } else {
                        maxDist = Math.max(maxDist, dist);
                    }
                }

                if (blackConvergence && i >= randomizedIterations) {
                    return [0, 0, 0, 255]; // Black for points inside the set
                }
                return colorization(i >= randomizedIterations ? 0 : i, pr, pi, zr, zi);
                // const c = i < randomizedIterations ? i : 100 / (sqrDivergenceRadius - maxDist);
                // if (i >= randomizedIterations) {
                //     totalMax = Math.max(totalMax, maxDist);
                // }
                // return colorization(c, pr, pi, zr, zi);
            }, size, size);

            // Report completion
            if (onProgress) {
                onProgress(1.0);
            }

            // Check again after generation
            if (abortRendering) {
                resolve(null as any);
                return;
            }

            if (gridIndex !== undefined) {
                const gridItem = gridContainer.children[gridIndex] as HTMLElement;
                const canvas = document.createElement('canvas');
                map.toCanvas(canvas);
                gridItem.innerHTML = '';
                gridItem.appendChild(canvas);
            }   

            resolve(map);
        }, 0);
    });
}

function getColorClassic(iterations: number, prevRe: number, prevIm: number, re: number, im: number): [number, number, number, number] {
    // This function can be expanded for more complex coloring based on previous values
    return colorGradient.get(iterations / 256);
}

function getColorPeriodic(iterations: number, prevRe: number, prevIm: number, re: number, im: number): [number, number, number, number] {
    const log_zn = Math.log(prevRe * prevRe + prevIm * prevIm) / 2;
    const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
    const smoothT = iterations / 256 + 1 - nu;
    return colorGradient.get(smoothT % 1);
}

function getColorSmooth(iterations: number, prevRe: number, prevIm: number, re: number, im: number): [number, number, number, number] {
    // Smooth coloring using logarithmic interpolation
    // The escape radius squared is 4, so we use log(2) as the base
    const magSq = re * re + im * im;
    const logMag = Math.log(magSq) / 2; // log of magnitude
    const nu = Math.log(logMag / Math.log(2)) / Math.log(2); // normalized escape time
    const smoothT = (iterations + 1 - nu) / 256;
    return colorGradient.get(Math.max(0, smoothT)); 
}

function getColorAngularFunc(angleMultiplier = 1, iterationMultiplier = 1) {
    return (iterations: number, prevRe: number, prevIm: number, re: number, im: number): [number, number, number, number] => {
        const [projectedRe, projectedIm] = projectOntoDivergenceRing(prevRe, prevIm, re, im);
        const angle = Math.atan2(projectedIm, projectedRe);
        const index = (iterationMultiplier * iterations / 256 + angleMultiplier * (1 + Math.sin(angle)) / 2);
        return colorGradient.get(index);
    };
}

const availableColorizations = [
    { f: getColorClassic, p: 0.2 },
    { f: getColorSmooth, p: 1.0 },
    { f: getColorPeriodic, p: 0.1 },
    { f: getColorAngularFunc(1), p: 0.1 },
    { f: getColorAngularFunc(2), p: 0.1 },
    { f: getColorAngularFunc(3), p: 0.1 },
    { f: getColorAngularFunc(4), p: 0.1 },
    { f: getColorAngularFunc(2, 8), p: 0.1 },
]

function getColorizationForSeed(seed: number) {
    const rnd = new Random(seed);
    const probabilityMass = availableColorizations.reduce((sum, c) => sum + c.p, 0);
    const r = rnd.uniform(0, probabilityMass);
    let cumulative = 0;
    let index = 0;
    for (let i = 0; i < availableColorizations.length; i++) {
        cumulative += availableColorizations[i].p;
        if (r < cumulative) {
            index = i;
            break;
        }
    }
    return availableColorizations[index].f;
}

function projectOntoDivergenceRing(zr: number, zi: number, re: number, img: number): [number, number] {
    const magPrev = Math.sqrt(zr * zr + zi * zi);
    const magCurr = Math.sqrt(re * re + img * img);
    // We expect that magPrev is < 2 and magCurr is > 2 at divergence
    // Use logarithmic interpolation since magnitude grows exponentially
    const logPrev = Math.log(magPrev);
    const logCurr = Math.log(magCurr);
    const logTarget = Math.log(2);
    const f = (logTarget - logPrev) / (logCurr - logPrev);
    const projectedZr = zr + f * (re - zr);
    const projectedZi = zi + f * (img - zi);
    return [projectedZr, projectedZi];
}

async function renderHD(size: number) {
    if (isRendering) return;
    
    isRendering = true;
    renderHdBtn.style.pointerEvents = 'none';
    renderHdBtn.style.opacity = '0.5';
    renderUhdBtn.style.pointerEvents = 'none';
    renderUhdBtn.style.opacity = '0.5';
    
    const sizeLabel = size === SIZE_HD ? 'HD' : 'UHD';
    const originalTitle = document.title;
    
    statusElement.textContent = `Rendering ${sizeLabel} (${size}×${size})...`;
    
    const centerItem = gridItems[4];
    const iterations = size === SIZE_HD ? ITERATIONS_HD : ITERATIONS_UHD;
    
    // Progress callback - note: this likely won't update the browser UI in real-time
    // because ImageLib.generate() runs synchronously, but the infrastructure is here
    // for future async improvements
    const onProgress = (progress: number) => {
        const percent = Math.round(progress * 100);
        document.title = `${percent}% - Julia Explorer`;
        statusElement.textContent = `Rendering ${sizeLabel} (${size}×${size})... ${percent}%`;
    };
    
    const rawMap = await renderJuliaSet(
        centerItem.real, 
        centerItem.imag, 
        size * 2, 
        iterations, 
        undefined, 
        undefined, 
        onProgress
    );
    
    // Resizing phase
    document.title = '99% - Julia Explorer';
    statusElement.textContent = `Rendering ${sizeLabel} (${size}×${size})... 99% (smoothing)`;
    
    const map = rawMap.resizeSmooth(size, size);
    
    map.toCanvas(overlayCanvas);
    overlay.classList.add('active');

    // Add meta info to bottom of rendering
    const ctx = overlayCanvas.getContext('2d')!;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, overlayCanvas.height - 30, overlayCanvas.width, 30);

    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(`re: ${centerItem.real.toFixed(9)}, im: ${centerItem.imag.toFixed(9)}`, 10, overlayCanvas.height - 10);
    ctx.fillText(`Color Seed: ${currentParams.colorSeed}`, overlayCanvas.width - 200, overlayCanvas.height - 10);
    
    document.title = originalTitle;
    statusElement.textContent = '';
    renderHdBtn.style.pointerEvents = '';
    renderHdBtn.style.opacity = '';
    renderUhdBtn.style.pointerEvents = '';
    renderUhdBtn.style.opacity = '';
    isRendering = false;
}

function closeOverlay() {
    overlay.classList.remove('active');
}
