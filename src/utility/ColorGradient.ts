import { absMod, clamp } from "../utility/util";
import { ColorMap, RGBAPixelMap } from "../image-lib";
import { Color, ColorRGB } from "../PixelMap";
import { Interpolator, Interpolators } from "./interpolation";
import { blendColors } from "./util";

export type ColorWrapTypes = "clamp" | "repeat" | "mirror" | "transparent" | "no-wrap";

const DEFAULT_COLOR_WRAP_TYPE: ColorWrapTypes = "clamp";

export default class ColorGradient {
    private colorFunc: (value: number) => Color;
    public get: (value: number) => Color;

    public constructor(
        colorFunc: (value: number) => Color | ColorRGB,
        wrapType: ColorWrapTypes = DEFAULT_COLOR_WRAP_TYPE,
    ) {
        this.colorFunc = (value: number) => {
            const c = colorFunc(value);
            if (c.length === 4) {
                // Already RGBA
                return c;
            } else {
                // RGB -> RGBA
                return [c[0], c[1], c[2], 255];
            }
        }
        this.setWrapType(wrapType);
    }

    public setWrapType(wrapType: ColorWrapTypes) {
        switch (wrapType) {
            case "clamp":
                this.get = (value: number) => this.colorFunc(clamp(value, 0, 1));
                break;
            case "repeat":
                this.get = (value: number) => this.colorFunc(absMod(value, 1));
                break;
            case "mirror":
                this.get = (value: number) => {
                    const v = absMod(value, 2);
                    return this.colorFunc(v > 1 ? 2 - v : v);
                }
                break;
            case "transparent":
                this.get = (value: number) => {
                    if (value < 0) {
                        const c = this.colorFunc(0);
                        c[3] = 0;
                        return c;
                    } else if (value > 1) {
                        const c = this.colorFunc(1);
                        c[3] = 0;
                        return c;
                    } else {
                        return this.colorFunc(value);
                    }
                }
                break;
            case "no-wrap":
                this.get = (value: number) => this.colorFunc(value);
                break;
            default:
                throw new Error("Invalid ColorGradient wrapType: " + wrapType);

        }
    }

    public createPreview(width = 512, height = 32, rangeFrom = 0, rangeTo = 1): RGBAPixelMap {
        const rangeWidth = rangeTo - rangeFrom;
        const rangeFactor = rangeWidth / (width - 1);
        return new ColorMap(width, height, (x, y) => this.get(rangeFrom + x * rangeFactor));
    }

    public toImage(width = 512, height = 32, rangeFrom = 0, rangeTo = 1) {
        return this.createPreview(width, height, rangeFrom, rangeTo).toImage();
    }

    public static uniform(
        colors: (Color | ColorRGB)[],
        interpolation: Interpolator = Interpolators.linear,
        wrapType?: ColorWrapTypes,
    ) {
        const n = colors.length - 1;
        const colorFunc = (value: number) => {
            const p = value * n;
            const i = clamp(Math.floor(p), 0, n);
            const t = p - i;
            return blendColors(colors[i], colors[i + 1] ?? colors[i], interpolation(t));
        }
        return new ColorGradient(colorFunc, wrapType);
    }
}