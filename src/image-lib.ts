

export type Color = [number, number, number, number];
export type ColorRGB = [number, number, number];

export type PixelProcessor<T> = (x: number, y: number, value: T) => void;

export type ImageGenerator<T> = (x: number, y: number) => T;

export type ImageFilter<T> = (value: T, x: number, y: number) => T;

export type ImageChannelFilter = ((value: number, color: Color, x: number, y: number) => number)

let currentlyConstructingPixelmap: PixelMap<any> | null = null;

export function isConstructingPixelmap(): PixelMap<any> | null {
    return currentlyConstructingPixelmap;
}
export class ImageLib {

    public static generate(gen: Colorizable | ImageGenerator<Colorizable>, width: number, height = width) {
        return new RGBAPixelMap(width, height, gen);
    }

    public static gen = ImageLib.generate;

    public static filter() {

    }

    public static createCanvas(width: number, height = width): HTMLCanvasElement {
        const cnv = document.createElement('canvas');
        cnv.width = width;
        cnv.height = height;
        return cnv;
    }

    public static createCanvasContext(width: number, height: number): CanvasRenderingContext2D {
        const cnv = this.createCanvas(width, height);
        const ctx = cnv.getContext("2d")!;
        return ctx;
    }

    public static createImageFromCanvas(canvas: HTMLCanvasElement): HTMLImageElement {
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

}

export abstract class PixelMap<T> {
    public readonly width: number;
    public readonly height: number;
    protected data: T[][];
    protected initialValue: T;

    constructor(width: number, height: number, initialValue: T | ImageGenerator<T>) {
        currentlyConstructingPixelmap = this;
        this.width = width;
        this.height = height;
        this.initialValue = initialValue instanceof Function ? initialValue(0, 0) : initialValue;
        const generator = initialValue instanceof Function ? initialValue : () => initialValue;
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

    forEach(processor: PixelProcessor<T>) {
        for (let y = 0; y < this.height; y++) {
            const row = this.data[y];
            for (let x = 0; x < this.width; x++) {
                processor(x, y, row[x]);
            }
        }
        return this;
    }

    fill(generator: T | ImageGenerator<T>) {
        if (generator instanceof Function) {
            // Generator function
            return this.forEach((x, y) => this.data[y][x] = (generator as ImageGenerator<T>)(x, y));
        } else {
            // Constant values
            return this.forEach((x, y) => this.data[y][x] = generator as T);
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
        other.fill((x, y) => this.data[y0 + y]?.[x0 + x] ?? initial);
        return other;
    }

    resize(width: number, height: number): PixelMap<T> {
        const other = this.clone(width, height);
        const xf = (this.width - 1) / (width - 1);
        const yf = (this.height - 1) / (height - 1);
        return other.fill((x, y) => {
            const sx = x * xf, sy = y * yf;
            const sx0 = Math.floor(sx), sy0 = Math.floor(sy), sx1 = Math.ceil(sx), sy1 = Math.ceil(sy);
            const sfx = sx - sx0;
            const top: T = this.blend(this.data[sy0][sx0], this.data[sy0][sx1], sfx);
            const btm: T = this.blend(this.data[sy1][sx0], this.data[sy1][sx1], sfx);
            return this.blend(top, btm, sy - sy0);
        });
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

    scaleSmooth(scaleX: number, scaleY: number): PixelMap<T> {
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

    abstract blend(v1: T, v2: T, blendFactor: number): T;

    toCanvas(canvas?: HTMLCanvasElement | null): HTMLCanvasElement {
        if (canvas && canvas.width !== this.width) {
            canvas.width = this.width;
        }
        if (canvas && canvas.height !== this.height) {
            canvas.height = this.height;
        }
        const ctx = canvas ? canvas.getContext("2d") : ImageLib.createCanvasContext(this.width, this.height);
        const imageData = ctx.createImageData(this.width, this.height);
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

    toImage(): HTMLImageElement {
        const cnv = this.toCanvas();
        return ImageLib.createImageFromCanvas(cnv);
    }
}

export type Colorizable = Color | ColorRGB | number | boolean;
export class RGBAPixelMap extends PixelMap<Color> {
    constructor(
        width: number,
        height = width,
        initialValue: Colorizable | ImageGenerator<Colorizable> = [255, 255, 255, 255]
    ) {
        if (initialValue instanceof Function) {
            initialValue = RGBAPixelMap.valueGeneratorToColor(initialValue);
        } else {
            initialValue = RGBAPixelMap.valueToColor(initialValue);
        }
        super(width, height, initialValue as Color | ImageGenerator<Color>);
    }

    static valueToColor(value: Colorizable): Color {
        if (value instanceof Array) {
            if (value.length >= 4) {
                // Already Color
                return value as Color;
            } else {
                // ColorRGB
                const result = value.slice();
                result[3] = 255; // alpha
                return result as Color;
            }
        } else if (typeof value === "number") {
            // number
            return [value, value, value, 255];
        } else {
            // boolean
            return value ? [255, 255, 255, 255] : [0, 0, 0, 255];
        }
    }
    
    static valueGeneratorToColor(gen: ImageGenerator<Colorizable>): ImageGenerator<Color> {
        const value = gen(0, 0);
        if (value instanceof Array) {
            if (value.length >= 4) {
                // Already Color
                return gen as ImageGenerator<Color>;
            } else {
                // ColorRGB
                return (x, y) => {
                    const result = gen(x, y);
                    result[3] = 255;
                    return result as Color;
                };
            }
        } else if (typeof value === "number") {
            // number
            return (x, y) => {
                const v = gen(x, y);
                return [v, v, v, 255] as Color;
            }
        } else {
            // boolean
            return (x, y) => {
                return gen(x, y) ? [255, 255, 255, 255] : [0, 0, 0, 255];
            }
        }
    }

    filter(filter: ImageFilter<Color> | ((value: Color, x: number, y: number) => number)) {
        const wrappedFilterFunc = (c: Color, x: number, y: number) => {
            const result = filter(c, x, y);
            if (!(result instanceof Array) && typeof result === 'number') {
                return [result, result, result, 255] as Color;
            }
            return result;
        };
        return super.filter(wrappedFilterFunc);
    }

    filterChannel(filter: ImageChannelFilter, channel: number) {
        return super.filter((c: Color, x: number, y: number) => {
            c[channel] = filter(c[channel], c, x, y);
            return c;
        });
    }

    filterR(filter: ImageChannelFilter) {
        return this.filterChannel(filter, 0)
    }

    filterG(filter: ImageChannelFilter) {
        return this.filterChannel(filter, 1)
    }

    filterB(filter: ImageChannelFilter) {
        return this.filterChannel(filter, 2)
    }

    filterA(filter: ImageChannelFilter) {
        return this.filterChannel(filter, 3);
    }

    public toColor(v: Color): Color { return v; }
    public clone(width = this.width, height = this.height) { return new RGBAPixelMap(width, height, (x, y) => this.data[y][x]); }
    public blend(a: Color, b: Color, f: number): Color {
        const alphaA = a[3] * (1 - f), alphaB = b[3] * f;
        const fullAlpha = Math.max(alphaA + alphaB, 0.001);
        const fB = alphaB / fullAlpha, fA = 1 - fB;
        return [
            fB * b[0] + fA * a[0],
            fB * b[1] + fA * a[1],
            fB * b[2] + fA * a[2],
            fullAlpha,
        ];
    }
    public toRGB(backgroundColor: number | ColorRGB = [255, 255, 255]): RGBPixelMap {
        let br = 0, bg = 0, bb = 0;
        if (backgroundColor instanceof Array) {
            br = backgroundColor[0];
            bg = backgroundColor[1];
            bb = backgroundColor[2];
        } else {
            br = backgroundColor;
            bg = backgroundColor;
            bb = backgroundColor;
        }
        return new RGBPixelMap(this.width, this.height, (x, y) => {
            const c = this.data[y][x];
            const a = c[3], a1 = 1 - a;
            return [
                a * c[0] + a1 * br,
                a * c[1] + a1 * bg,
                a * c[2] + a1 * bb,
            ];
        })
    }
}
export const ColorMap = RGBAPixelMap;

export class RGBPixelMap extends PixelMap<ColorRGB> {
    constructor(width: number, height = width, initialValue: ColorRGB | ImageGenerator<ColorRGB> = [255, 255, 255]) {
        super(width, height, initialValue);
    }
    public toColor(v: ColorRGB): Color { return [v[0], v[1], v[2], 255]; }
    public clone(width = this.width, height = this.height) { return new RGBPixelMap(width, height, (x, y) => this.data[y][x]); }
    public blend(a: ColorRGB, b: ColorRGB, f: number): ColorRGB {
        const f1 = 1 - f;
        return [
            f * b[0] + f1 * a[0],
            f * b[1] + f1 * a[1],
            f * b[2] + f1 * a[2]
        ];
    }
    public toRGBA(alpha = 255): RGBAPixelMap {
        return new RGBAPixelMap(this.width, this.height, (x, y) => [... this.data[y][x], alpha] as Color);
    }
    public toGrayscale(fr = 0.2989, fg = 0.5870, fb = 0.1140) {
        return new GrayscalePixelMap(this.width, this.height, (x, y) => {
            const c = this.data[y][x];
            return fr * c[0] + fg * c[1] + fb * c[2];
        });
    }
}

export class GrayscalePixelMap extends PixelMap<number> {
    constructor(width: number, height = width, initialValue: number | ImageGenerator<number> = 0) {
        super(width, height, initialValue);
    }
    public toColor(v: number): Color { return [v, v, v, 255]; }
    public clone(width = this.width, height = this.height) { return new GrayscalePixelMap(width, height, (x, y) => this.data[y][x]); }
    public blend(a: number, b: number, f: number): number { return f * b + (1 - f) * a; }
    public toRGB(): RGBPixelMap {
        return new RGBPixelMap(this.width, this.height, (x, y) => {
            const c = this.data[y][x];
            return [c, c, c];
        })
    }
}

export class BoolPixelMap extends PixelMap<boolean> {
    constructor(width: number, height = width, initialValue: boolean | ImageGenerator<boolean> = false) {
        super(width, height, initialValue);
    }
    public toColor(v: boolean): Color { const c = v ? 255 : 0; return [c, c, c, 255]; }
    public clone(width = this.width, height = this.height) { return new BoolPixelMap(width, height, (x, y) => this.data[y][x]); }
    public blend(a: boolean, b: boolean, f: number): boolean { return f > 0.5 ? b : a; }
}
