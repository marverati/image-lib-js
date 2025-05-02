import { Color } from "../PixelMap";

export type ColorPickerHandler = (color: Color, colorString: string) => void;

// Define the CSS rule
const colorPickerCursorStyle = `
body.color-picker, body.color-picker * {
    cursor: crosshair !important;
}
`;

export class ColorPicker {
    private enabled = false;
    private handler: ColorPickerHandler = () => {};
    private static styleAdded = false; // Static flag to track if style is added

    constructor(
        private canvases?: HTMLCanvasElement[],
    ) {
        // Add the style only once
        if (!ColorPicker.styleAdded) {
            const styleElement = document.createElement('style');
            styleElement.textContent = colorPickerCursorStyle;
            document.head.appendChild(styleElement);
            ColorPicker.styleAdded = true;
        }

        if (canvases) {
            for (const canvas of this.canvases) {
                canvas.addEventListener('click', this.handleClick.bind(this));
            }
        } else {
            document.body.addEventListener('click', this.handleClick.bind(this));
        }
    }

    public toggle(handler: ColorPickerHandler) {
        if (this.enabled) {
            this.disable();
        } else {
            this.enable(handler);
        }
    }

    public enable(handler: ColorPickerHandler) { // Update handler type
        this.handler = handler;
        this.enabled = true;
        document.body.classList.add('color-picker');
    }

    public disable() {
        this.handler = () => {};
        this.enabled = false;
        document.body.classList.remove('color-picker');
    }

    private handleClick(event: MouseEvent) {
        if (!this.enabled) return;

        const canvas = event.target as HTMLCanvasElement;
        // Check if the click is actually on the canvas content, not just the element bounds
        if (!canvas.offsetParent) return; // Ignore clicks if canvas is not visible/rendered
        if (!canvas.getContext) return; // Ignore clicks on non-canvas elements

        const ctx = canvas.getContext('2d', { willReadFrequently: true }); // Optimize for frequent reads
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        // Calculate precise coordinates within the canvas, considering CSS scaling
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.floor((event.clientX - rect.left) * scaleX);
        const y = Math.floor((event.clientY - rect.top) * scaleY);

        // Ensure coordinates are within canvas bounds
        if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
            console.warn("Click outside canvas content area.");
            return;
        }


        try {
            const pixelData = ctx.getImageData(x, y, 1, 1).data;
            const color = Array.from(pixelData).slice(0, 4) as Color;
            // Use alpha value from pixel data for rgba string
            const colorString = `rgba(${pixelData[0]}, ${pixelData[1]}, ${pixelData[2]}, ${pixelData[3] / 255})`;

            this.handler(color, colorString);
            this.disable();
        } catch(e) {
            // More specific error handling for security errors
            if (e instanceof DOMException && e.name === 'SecurityError') {
                 console.error("Cannot get pixel data: Canvas has been tainted by cross-origin data.");
            } else {
                console.error("Error getting pixel data: ", e);
            }
            // Optionally disable picker on error too
            // this.disable();
        }
    }
}