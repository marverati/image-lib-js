import { Color, ColorRGB, ImageChannelFilter, ImageFilter, ImageGenerator, PixelMap } from "./PixelMap";



export function isConstructingPixelmap(): PixelMap<any> | null {
    return PixelMap.currentlyConstructing();
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

    public static createCanvasFromImage(img: HTMLImageElement): HTMLCanvasElement {
        const ctx = this.createCanvasContext(img.naturalWidth, img.naturalHeight);
        ctx.drawImage(img, 0, 0);
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
    public fromColor(v: Color): Color { return v; }
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

    public static fromImage(img: HTMLImageElement): RGBAPixelMap {
        const cnv = ImageLib.createCanvasFromImage(img);
        document.body.appendChild(cnv);
        const w = img.naturalWidth;
        const data = cnv.getContext("2d").getImageData(0, 0, w, img.naturalHeight).data;
        return new RGBAPixelMap(w, img.naturalHeight, (x: number, y: number) => {
            const p = 4 * (y * w + x);
            return [ data[p], data[p+1], data[p+2], data[p+3] ];
        });
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

    public static fromImage(img: HTMLImageElement): RGBPixelMap {
        const cnv = ImageLib.createCanvasFromImage(img);
        const data = cnv.getContext("2d").getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;
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
    public clone(width = this.width, height = this.height) { return new GrayscalePixelMap(width, height, (x, y) => this.data[y][x]); }
    public blend(a: number, b: number, f: number): number { return f * b + (1 - f) * a; }
    public toRGB(): RGBPixelMap {
        return new RGBPixelMap(this.width, this.height, (x, y) => {
            const c = this.data[y][x];
            return [c, c, c];
        })
    }

    public static fromImage(img: HTMLImageElement): GrayscalePixelMap {
        const cnv = ImageLib.createCanvasFromImage(img);
        const data = cnv.getContext("2d").getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;
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
    public clone(width = this.width, height = this.height) { return new BoolPixelMap(width, height, (x, y) => this.data[y][x]); }
    public blend(a: boolean, b: boolean, f: number): boolean { return f > 0.5 ? b : a; }

    public static fromImage(img: HTMLImageElement): BoolPixelMap {
        const cnv = ImageLib.createCanvasFromImage(img);
        const data = cnv.getContext("2d").getImageData(0, 0, img.naturalWidth, img.naturalHeight).data;
        return new BoolPixelMap(img.naturalWidth, img.naturalHeight, (x: number, y: number) => BoolPixelMap.fromColor(data[y][x]));
    }
}
