import { Canvas, CanvasRenderingContext2D, createCanvas, Image } from "canvas";
import { Color, ColorRGB, ImageChannelFilter, ImageFilter, ImageGenerator, PixelMap } from "./PixelMap";



export function isConstructingPixelmap(): PixelMap<any> | null {
    return PixelMap.currentlyConstructing();
}

export class ImageLib {
    public static width = 512;
    public static height = 512;

    public static setDefaultSize(width = 512, height = width) {
        this.width = width;
        this.height = height;
    }

    public static generate(gen: Color | ImageGenerator<Color>, width?: number, height?: number): RGBAPixelMap;
    public static generate(gen: ColorRGB | ImageGenerator<ColorRGB>, width?: number, height?: number): RGBPixelMap;
    public static generate(gen: number | ImageGenerator<number>, width?: number, height?: number): GrayscalePixelMap;
    public static generate(gen: boolean | ImageGenerator<boolean>, width?: number, height?: number): BoolPixelMap;

    public static generate(gen: Colorizable | ImageGenerator<Colorizable>, width = this.width, height = this.height) {
        const example = gen instanceof Function ? gen(0, 0) : gen;
        if (example instanceof Array) {
            if (example.length >= 4) {
                return new RGBAPixelMap(width, height, gen as ImageGenerator<Color>);
            } else {
                return new RGBPixelMap(width, height, gen as ImageGenerator<ColorRGB>);
            }
        } else if (typeof example === "number") {
            return new GrayscalePixelMap(width, height, gen as ImageGenerator<number>);
        } else if (typeof example === "boolean"){
            return new BoolPixelMap(width, height, gen as ImageGenerator<boolean>);
        }
        // Should never happen
        console.warn("Unknown type of image generator: ", gen);
        return new RGBAPixelMap(width, height, gen);
    }

    
    public static generateRadial(gen: ImageGenerator<Color>, width?: number, height?: number): RGBAPixelMap;
    public static generateRadial(gen: ImageGenerator<ColorRGB>, width?: number, height?: number): RGBPixelMap;
    public static generateRadial(gen: ImageGenerator<number>, width?: number, height?: number): GrayscalePixelMap;
    public static generateRadial(gen: ImageGenerator<boolean>, width?: number, height?: number): BoolPixelMap;

    public static generateRadial(gen: ImageGenerator<Colorizable>, width = this.width, height = this.height) {
        const xMid = width / 2, yMid = height / 2;
        const wrappedGen: ImageGenerator<Colorizable> = (x: number, y: number) => {
            const dx = x - xMid, dy = y - yMid;
            const angle = Math.atan2(dy, dx);
            const dist = Math.sqrt(dx * dx + dy * dy);
            return gen(angle, dist);
        }
        return (ImageLib.generate as any)(wrappedGen, width, height); // TODO: find proper solution for typing
    }

    public static gen = this.generate;

    
    public static filter<T>(map: PixelMap<T>, mapping: (c: T, x: number, y: number) => Color): RGBAPixelMap;
    public static filter<T>(map: PixelMap<T>, mapping: (c: T, x: number, y: number) => ColorRGB): RGBPixelMap;
    public static filter<T>(map: PixelMap<T>, mapping: (c: T, x: number, y: number) => number): GrayscalePixelMap;
    public static filter<T>(map: PixelMap<T>, mapping: (c: T, x: number, y: number) => boolean): BoolPixelMap;

    public static filter<T, Q>(map: PixelMap<T>, mapping: (c: T, x: number, y: number) => Q): PixelMap<Q> {
        const generatorFunc = (x: number, y: number) => mapping(map.getFast(x, y), x, y);
        return (this.generate as any)(generatorFunc, map.width, map.height);
    }

    public static combine<T, U>(a: PixelMap<T>, b: PixelMap<U>, mapping: (a: T, b: U, x: number, y: number) => Color): RGBAPixelMap;
    public static combine<T, U>(a: PixelMap<T>, b: PixelMap<U>, mapping: (a: T, b: U, x: number, y: number) => ColorRGB): RGBPixelMap;
    public static combine<T, U>(a: PixelMap<T>, b: PixelMap<U>, mapping: (a: T, b: U, x: number, y: number) => number): GrayscalePixelMap;
    public static combine<T, U>(a: PixelMap<T>, b: PixelMap<U>, mapping: (a: T, b: U, x: number, y: number) => boolean): BoolPixelMap;

    public static combine<T, U, V>(a: PixelMap<T>, b: PixelMap<U>, mapping: (a: T, b: U, x: number, y: number) => V, stretchToFit = true): PixelMap<V> {
        let generatorFunc: ImageGenerator<V>;
        if (a.width === b.width && a.height === b.height) {
            generatorFunc = (x: number, y: number) => mapping(a.getFast(x, y), b.getFast(x, y), x, y);
        } else if (stretchToFit) {
            const fx = (b.width - 1) / (a.width - 1), fy = (b.height - 1) / (a.height - 1);
            generatorFunc = (x: number, y: number) => mapping(a.getFast(x, y), b.get(x * fx, y * fy), x, y);
        } else {
            generatorFunc = (x: number, y: number) => mapping(a.getFast(x, y), b.get(x, y), x, y);
        }
        return (this.generate as any)(generatorFunc, a.width, a.height);
    }

    public static createCanvas(width = this.width, height = this.height): HTMLCanvasElement | Canvas {
        const cnv = typeof document !== 'undefined' ? document.createElement('canvas') : createCanvas(width, height);
        cnv.width = width;
        cnv.height = height;
        return cnv;
    }

    public static createCanvasContext(width = this.width, height = this.height): CanvasRenderingContext2D {
        const cnv = this.createCanvas(width, height);
        const ctx = cnv.getContext("2d")! as CanvasRenderingContext2D;
        return ctx;
    }

    public static createImageFromCanvas(canvas: HTMLCanvasElement | Canvas): HTMLImageElement | Image {
        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    public static createCanvasFromImage(img: HTMLImageElement | Image): HTMLCanvasElement | Canvas {
        const ctx = this.createCanvasContext(img.naturalWidth ?? img.width, img.naturalHeight ?? img.height);
        ctx.drawImage(img as Image, 0, 0);
        return ctx.canvas;
    }

}

export type Colorizable = Color | ColorRGB | number | boolean;
export class RGBAPixelMap extends PixelMap<Color> {
    constructor(
        width: number,
        height = width,
        initialValue: Colorizable | ImageGenerator<Colorizable> = [0, 0, 0, 0]
    ) {
        if (initialValue instanceof Function) {
            initialValue = RGBAPixelMap.valueGeneratorToColor(initialValue);
        } else {
            if (initialValue instanceof Array) {
                const value = initialValue;
                initialValue = () => (RGBAPixelMap.valueToColor(value).slice() as Color);
            } else {
                initialValue = RGBAPixelMap.valueToColor(initialValue);
            }
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

    fill(generator: Colorizable | ImageGenerator<Colorizable>) {
        if (!(generator instanceof Function)) {
            const value = RGBAPixelMap.valueToColor(generator);
            return super.fill(() => value.slice() as Color);
        } else {
            return super.fill((x, y) => RGBAPixelMap.valueToColor(generator(x, y)));
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
    public fromColor(v: Color): Color { return v; }
    public clone(width = this.width, height = this.height) { return new RGBAPixelMap(width, height, (x, y) => this.get(x, y)); }
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

    public static fromImage(img: HTMLImageElement): RGBAPixelMap {
        return this.fromCanvas(ImageLib.createCanvasFromImage(img));
    }

    public static fromCanvas(cnv: HTMLCanvasElement | Canvas): RGBAPixelMap {
        const ctx = cnv.getContext("2d") as CanvasRenderingContext2D;
        const w = cnv.width;
        const h = cnv.height;
        const data = ctx.getImageData(0, 0, w, h).data;
        return new RGBAPixelMap(w, h, (x: number, y: number) => {
            const p = 4 * (y * w + x);
            return [ data[p], data[p+1], data[p+2], data[p+3] ];
        });
    }

    public extractR(): GrayscalePixelMap {
        return new GrayscalePixelMap(this.width, this.height, (x, y) => this.data[y][x][0]);
    }

    public extractG(): GrayscalePixelMap {
        return new GrayscalePixelMap(this.width, this.height, (x, y) => this.data[y][x][1]);
    }

    public extractB(): GrayscalePixelMap {
        return new GrayscalePixelMap(this.width, this.height, (x, y) => this.data[y][x][2]);
    }

    public extractA(): GrayscalePixelMap {
        return new GrayscalePixelMap(this.width, this.height, (x, y) => this.data[y][x][3]);
    }
}
export const ColorMap = RGBAPixelMap;

export class RGBPixelMap extends PixelMap<ColorRGB> {
    constructor(width: number, height = width, initialValue: ColorRGB | ImageGenerator<ColorRGB> = [255, 255, 255]) {
        super(width, height, initialValue);
    }
    public toColor(v: ColorRGB): Color { return [v[0], v[1], v[2], 255]; }
    public static fromColor(c: Color): ColorRGB { return c.slice(0, 3) as ColorRGB; }
    public fromColor(c: Color) { return RGBPixelMap.fromColor(c); }
    public clone(width = this.width, height = this.height) { return new RGBPixelMap(width, height, (x, y) => this.get(x, y)); }
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

    public static fromImage(img: HTMLImageElement): RGBPixelMap {
        const cnv = ImageLib.createCanvasFromImage(img);
        const data = (cnv.getContext("2d") as CanvasRenderingContext2D).getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;
        return new RGBPixelMap(img.naturalWidth, img.naturalHeight, (x: number, y: number) => RGBPixelMap.fromColor(data[y][x]));
    }
}

export class GrayscalePixelMap extends PixelMap<number> {
    constructor(width: number, height = width, initialValue: number | ImageGenerator<number> = 0) {
        super(width, height, initialValue);
    }
    public toColor(v: number): Color { return [v, v, v, 255]; }
    public static fromColor(c: Color): number { return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] }
    public fromColor(c: Color) { return GrayscalePixelMap.fromColor(c); }
    public clone(width = this.width, height = this.height) { return new GrayscalePixelMap(width, height, (x, y) => this.get(x, y)); }
    public blend(a: number, b: number, f: number): number { return f * b + (1 - f) * a; }
    public toRGB(): RGBPixelMap {
        return new RGBPixelMap(this.width, this.height, (x, y) => {
            const c = this.data[y][x];
            return [c, c, c];
        })
    }
    public toRGBA(): RGBAPixelMap {
        return new RGBAPixelMap(this.width, this.height, (x, y) => {
            const c = this.data[y][x];
            return [c, c, c, 255];
        })
    }


    public static fromImage(img: HTMLImageElement): GrayscalePixelMap {
        const cnv = ImageLib.createCanvasFromImage(img);
        const data = (cnv.getContext("2d") as CanvasRenderingContext2D).getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;
        return new GrayscalePixelMap(img.naturalWidth, img.naturalHeight, (x: number, y: number) => GrayscalePixelMap.fromColor(data[y][x]));
    }
}

export class BoolPixelMap extends PixelMap<boolean> {
    constructor(width: number, height = width, initialValue: boolean | ImageGenerator<boolean> = false) {
        super(width, height, initialValue);
    }
    public static fromColor(c: Color): boolean { return c[0] + c[1] + c[2] > 382.5; }
    public fromColor(c: Color) { return BoolPixelMap.fromColor(c); }
    public toColor(v: boolean): Color { const c = v ? 255 : 0; return [c, c, c, 255]; }
    public clone(width = this.width, height = this.height) { return new BoolPixelMap(width, height, (x, y) => this.get(x, y)); }
    public blend(a: boolean, b: boolean, f: number): boolean { return f > 0.5 ? b : a; }

    public static fromImage(img: HTMLImageElement): BoolPixelMap {
        const cnv = ImageLib.createCanvasFromImage(img);
        const data = (cnv.getContext("2d") as CanvasRenderingContext2D).getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;
        return new BoolPixelMap(img.naturalWidth, img.naturalHeight, (x: number, y: number) => BoolPixelMap.fromColor(data[y][x]));
    }
}
