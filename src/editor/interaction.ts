
export type FrameHandler = (context: FrameHandlerContext) => void | boolean;
export type FrameHandlerContext = {
    /** Current mouse position */
    mouse: {
        x: number;
        y: number;
        z: number;
        screenX: number;
        screenY: number;
        left: number;
        right: number;
        middle: number;
        inside: boolean;
        dx: number;
        dy: number;
        dz: number;
        screenDx: number;
        screenDy: number;
    }
    /** Time and frame (all times in seconds) */
    frame: number;
    fps: number;
    time: number; // since last execution
    scriptTime: number;
    appTime: number;
    /** Time since last frame in s */
    deltaTime: number;
    /** Keys, always contains keys in state != 0, with value 1 = down, 2 = newly down, -1 = released */
    keyStates: { [key: string]: number };
    keysDown: Set<string>;
}

let frameTimes: number[] = [];

let currentContext: FrameHandlerContext = {
    mouse: {
        x: 0,
        y: 0,
        z: 0,
        screenX: 0,
        screenY: 0,
        dx: 0,
        dy: 0,
        dz: 0,
        screenDx: 0,
        screenDy: 0,
        inside: false,
        left: 0,
        right: 0,
        middle: 0,
    },
    keyStates: {},
    keysDown: new Set<string>(),
    frame: 0,
    fps: 0,
    time: 0,
    scriptTime: 0,
    appTime: 0,
    deltaTime: 0,
}

let appStart = performance.now() / 1000;
let scriptStart = appStart;
let runStart = appStart;

export function setupInteraction(canvas: HTMLCanvasElement) {
    // Observe mouse
    window.addEventListener('mousemove', (e) => {
        currentContext.mouse.screenDx = e.screenX - currentContext.mouse.screenX;
        currentContext.mouse.screenDy = e.screenY - currentContext.mouse.screenY;
        currentContext.mouse.screenX = e.screenX;
        currentContext.mouse.screenY = e.screenY;
        const newX = (e.clientX - canvas.offsetLeft) / canvas.offsetWidth * canvas.width;
        const newY = (e.clientY - canvas.offsetTop) / canvas.offsetHeight * canvas.height;
        currentContext.mouse.dx = newX - currentContext.mouse.x;
        currentContext.mouse.dy = newY - currentContext.mouse.y;
        currentContext.mouse.x = newX;
        currentContext.mouse.y = newY;
        currentContext.mouse.inside = newX >= 0 && newX < canvas.width && newY >= 0 && newY < canvas.height;
    });
    window.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            currentContext.mouse.left = updateKeyState(currentContext.mouse.left, true);
            e.preventDefault();
            e.stopPropagation();
        } else if (e.button === 1) {
            currentContext.mouse.middle = updateKeyState(currentContext.mouse.middle, true);
        } else if (e.button === 2) {
            currentContext.mouse.right = updateKeyState(currentContext.mouse.right, true);
        }
    });
    window.addEventListener('mouseup', (e) => {
        if (e.button === 0) {
            currentContext.mouse.left = updateKeyState(currentContext.mouse.left, false);
        } else if (e.button === 1) {
            currentContext.mouse.middle = updateKeyState(currentContext.mouse.middle, false);
        } else if (e.button === 2) {
            currentContext.mouse.right = updateKeyState(currentContext.mouse.right, false);
        }
    });
    // Observe keyboard
    window.addEventListener('keydown', (e) => {
        // currentContext.keys[e.key] = updateKeyState(currentContext.keys[e.key] || 0, true);
        currentContext.keysDown.add(e.key);
    });
    window.addEventListener('keyup', (e) => {
        // const newState = updateKeyState(currentContext.keys[e.key] || 0, false);
        // if (newState !== 0) {
        //     currentContext.keys[e.key] = newState;
        // } else {
        //     delete currentContext.keys[e.key];
        // }
        currentContext.keysDown.delete(e.key);
    });
}

export function markScriptLoaded() {
    scriptStart = performance.now() / 1000;
    frameTimes = [];
}

export function markScriptStarted() {
    runStart = performance.now() / 1000;
    frameTimes = [];
}

export function updateAndGetFrameContext() {
    // Update frame and times
    currentContext.frame++;
    const now = performance.now() / 1000 - appStart;
    currentContext.deltaTime = now - currentContext.appTime;
    currentContext.appTime = now;
    currentContext.scriptTime = now - scriptStart;
    currentContext.time = now - runStart;
    // Calculate FPS
    frameTimes.push(currentContext.time);
    while (frameTimes[0] < currentContext.time - 1) {
        frameTimes.shift();
    }
    currentContext.fps = frameTimes.length;
    // Key states
    const keysToObserve = new Set<string>(currentContext.keysDown);
    for (const key in currentContext.keyStates) {
        keysToObserve.add(key);
    }
    for (const key of keysToObserve) {
        const newState = currentContext.keysDown.has(key);
        currentContext.keyStates[key] = updateKeyState(currentContext.keyStates[key] || 0, newState);
    }
    return currentContext;
}

function updateKeyState(old: number, newState: boolean): number {
    if (newState) {
        if (old <= 0) {
            return 2; // newly down
        } else {
            return 1; // down
        }
    } else {
        if (old <= 0) {
            return 0; // not pressed
        } else {
            return -1; // released
        }
    }
}