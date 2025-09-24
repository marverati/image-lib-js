// Types for optional canvas module - these will be available via ImageLib
type CanvasType = any;
import { absMod, clamp, mirrorOutsideRange } from "./utility/util";
import { ImageLib } from "./image-lib";



export type Color = [number, number, number, number];
export type ColorRGB = [number, number, number];

export type PixelProcessor<T> = (x: number, y: number, value: T) => void;

export type ImageGenerator<T> = (x: number, y: number) => T;

export type ImageFilter<T> = (value: T, x: number, y: number) => T;

export type ImageChannelFilter = ((value: number, color: Color, x: number, y: number) => number);

export type PixelGetter<T> = (x: number, y: number) => T;

export type WrapMode = "clamp" | "repeat" | "mirror" | "initial";

export type InterpolationMode = "floor" | "nearest" | "bilinear" | "bicubic" | "stochastic";

const WRAP_MODE_DEFAULT: WrapMode = "initial";

const INTERPOLATION_MODE_DEFAULT: InterpolationMode = "bilinear";

let currentlyConstructingPixelmap: PixelMap<any> | null = null;

export abstract class PixelMap<T> {
    public readonly width: number;
    public readonly height: number;
    protected data: T[][];
    protected initialValue: T;
    public get: PixelGetter<T>;
    private wrapMode: WrapMode;
    private wrapGetter: PixelGetter<T>;
    private interpolationMode: InterpolationMode;

    constructor(width: number, height: number, initialValue: T | ImageGenerator<T>) {
        currentlyConstructingPixelmap = this;
        this.width = width;
        this.height = height;
        this.initialValue = initialValue instanceof Function ? initialValue(0, 0) : initialValue;
        const generator = initialValue instanceof Function ? initialValue : () => initialValue;
        this.setWrapMode(WRAP_MODE_DEFAULT);
        this.setInterpolationMode(INTERPOLATION_MODE_DEFAULT);
        // Set up pixel data
        this.data = [];
        for (let y = 0; y < height; y++) {
            const row: T[] = [];
            this.data[y] = row;
            for (let x = 0; x < width; x++) {
                row[x] = generator(x, y);
            }
        }
        currentlyConstructingPixelmap = null;
    }

    public static currentlyConstructing(): PixelMap<any> | null {
        return currentlyConstructingPixelmap;
    }

    getFast(x: number, y: number): T | undefined {
        return this.data[y][x];
    }

    set(x: number, y: number, value: T): void {
        this.data[y][x] = value;
    }

    setWrapMode(wrapMode: WrapMode) {
        if (wrapMode !== this.wrapMode) {
            this.wrapMode = wrapMode;
            this.wrapGetter = this.getWrapGetter(wrapMode);
        }
    }

    setInterpolationMode(interpolationMode: InterpolationMode) {
        if (interpolationMode !== this.interpolationMode) {
            this.interpolationMode = interpolationMode;
            this.get = this.getInterpolationGetter(interpolationMode);
        }
    }

    private getInterpolationGetter(interpolationMode: InterpolationMode): PixelGetter<T> {
        switch (interpolationMode) {
            case "floor":
                return (x, y) => this.wrapGetter(Math.floor(x), Math.floor(y));
            case "nearest":
                return (x, y) => this.wrapGetter(Math.round(x), Math.round(y));
            case "stochastic":
                return (x, y) => {
                    const x0 = Math.floor(x), y0 = Math.floor(y), x1 = x0 + 1, y1 = y0 + 1;
                    if (x === x0) {
                        if (y === y0) {
                            // X and Y are both integers
                            return this.wrapGetter(x0, y0);
                        }
                        // X is integer, Y is not
                        return Math.random() > (y - y0) ? this.wrapGetter(x0, y0) : this.wrapGetter(x0, y1);
                    } else {
                        if (y === y0) {
                            // Y is integer, X is not
                            return Math.random() > (x - x0) ? this.wrapGetter(x0, y0) : this.wrapGetter(x1, y0);
                        } else {
                            // Bilinear interpolation case, neither X nor Y are integers
                            return Math.random() > (x - x0)
                                ? (Math.random() > (y - y0) ? this.wrapGetter(x0, y0) : this.wrapGetter(x1, y0))
                                : (Math.random() > (y - y0) ? this.wrapGetter(x0, y1) : this.wrapGetter(x1, y1));
                        }
                    }
                }
            case "bilinear":
                return (x, y) => {
                    const x0 = Math.floor(x), y0 = Math.floor(y), x1 = x0 + 1, y1 = y0 + 1;
                    if (x === x0) {
                        if (y === y0) {
                            // X and Y are both integers
                            return this.wrapGetter(x0, y0);
                        }
                        // X is integer, Y is not
                        return this.blend(this.wrapGetter(x0, y0), this.wrapGetter(x0, y1), y - y0);
                    } else {
                        if (y === y0) {
                            // Y is integer, X is not
                            return this.blend(this.wrapGetter(x0, y0), this.wrapGetter(x1, y0), x - x0);
                        } else {
                            // Bilinear interpolation case, neither X nor Y are integers
                            const tl = this.wrapGetter(x0, y0), tr = this.wrapGetter(x1, y0);
                            const bl = this.wrapGetter(x0, y1), br = this.wrapGetter(x1, y1);
                            return this.blend(
                                this.blend(tl, tr, x - x0),
                                this.blend(bl, br, x - x0),
                                y - y0,
                            );
                        
                        }
                    }
                }
            case "bicubic":
                throw new Error('Bicubic interpolation not yet supported');
        }
    }

    private getWrapGetter(wrapMode: WrapMode): PixelGetter<T> {
        switch (wrapMode) {
            case "clamp":
                return (x, y) => this.data[Math.floor(clamp(y, 0, this.height - 1))][Math.floor(clamp(x, 0, this.width - 1))];
            case "repeat":
                return (x, y) => this.data[absMod(y, this.height)][absMod(x, this.width)];
            case "mirror":
                return (x, y) => this.data[mirrorOutsideRange(y, 0, this.height - 1)][mirrorOutsideRange(x, 0, this.width - 1)];
            case "initial":
                return (x, y) => this.data[y]?.[x] ?? this.initialValue;
        }
    }

    forEach(processor: PixelProcessor<T>) {
        for (let y = 0; y < this.height; y++) {
            const row = this.data[y];
            for (let x = 0; x < this.width; x++) {
                processor(x, y, row[x]);
            }
        }
        return this;
    }

    some(predicate: (x: number, y: number, value: T) => boolean): boolean {
        for (let y = 0; y < this.height; y++) {
            const row = this.data[y];
            for (let x = 0; x < this.width; x++) {
                if (predicate(x, y, row[x])) {
                    return true;
                }
            }
        }
        return false;
    }

    fill(generator: T | ImageGenerator<T>) {
        if (generator instanceof Function) {
            // Generator function
            return this.forEach((x, y) => this.data[y][x] = generator(x, y));
        } else {
            // Constant values
            return this.forEach((x, y) => this.data[y][x] = generator);
        }
    }

    filter(filter: ImageFilter<T>) {
        return this.forEach((x, y, value) => this.data[y][x] = filter(value, x, y));
    }

    filterBuffered(filter: ImageFilter<T>) {
        const newData: T[][] = [];
        for (let y = 0; y < this.height; y++) {
            const row: T[] = [];
            newData[y] = row;
            for (let x = 0; x < this.width; x++) {
                row[x] = filter(this.data[y][x], x, y);
            }
        }
        this.data = newData;
    }

    crop(x0: number, y0: number, w = this.width - x0, h = this.height - y0): PixelMap<T> {
        const initial = this.initialValue;
        const other = this.clone(w, h);
        return other.fill((x, y) => this.get(x0 + x, y0 + y));
    }

    resize(width: number, height: number): PixelMap<T> {
        const other = this.clone(width, height);
        const xf = (width > 1) ? ((this.width - 1) / (width - 1)) : 0;
        const yf = (height > 1) ? ((this.height - 1) / (height - 1)) : 0;
        return other.fill((x, y) => this.get(x * xf, y * yf));
    }

    resizeSmooth(width: number, height: number): PixelMap<T> {
        const sx = width / this.width, sy = height / this.height;
        return this.scaleSmooth(sx, sy);
    }

    scale(scaleX: number, scaleY = scaleX): PixelMap<T> {
        const w = Math.round(this.width * scaleX);
        const h = Math.round(this.height * scaleY);
        return this.resize(w, h);
    }

    scaleSmooth(scaleX: number, scaleY = scaleX): PixelMap<T> {
        // Early exit in case regular scaling is equally good (smooth scaling only helps for shrinking images by more than 2x)
        if (scaleX >= 0.5 && scaleY >= 0.5) {
            return this.scale(scaleX, scaleY);
        }
        // Sufficient shrinking required to split into multiple steps
        // We perform one scaling step limited to 2x, followed by a ~recursive call to smooth scaling for the rest
        const sx = Math.max(scaleX, 0.5), sy = Math.max(scaleY, 0.5);
        return this.scale(sx, sy).scaleSmooth(scaleX / sx, scaleY / sy);
    }

    abstract clone(width?: number, height?: number): PixelMap<T>;

    abstract toColor(value: T): Color;

    abstract fromColor(color: Color): T;

    abstract blend(v1: T, v2: T, blendFactor: number): T;

    toCanvas(canvas?: HTMLCanvasElement | null): HTMLCanvasElement | CanvasType {
        if (canvas && canvas.width !== this.width) {
            canvas.width = this.width;
        }
        if (canvas && canvas.height !== this.height) {
            canvas.height = this.height;
        }
        const ctx = canvas ? canvas.getContext("2d") : ImageLib.createCanvasContext(this.width, this.height);
        const imageData = ctx.createImageData(this.width, this.height) as ImageData;
        const data = imageData.data;
        // Apply pixel color
        this.forEach((x, y, value) => {
            const color = this.toColor(value);
            const p = 4 * (x + this.width * y);
            data[p] = color[0];
            data[p + 1] = color[1];
            data[p + 2] = color[2];
            data[p + 3] = color[3];
        });
        ctx.putImageData(imageData, 0, 0);
        return ctx.canvas;
    }

    toImage(): HTMLImageElement | any {
        const cnv = this.toCanvas();
        return ImageLib.createImageFromCanvas(cnv);
    }
}