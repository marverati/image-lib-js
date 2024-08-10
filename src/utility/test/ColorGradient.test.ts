import ColorGradient from '../ColorGradient';
import { blendColors } from '../util';
import { Color, ColorRGB } from '../../PixelMap';
import './customMatcher';

describe('ColorGradient', () => {
    const rgbColor: ColorRGB = [255, 0, 0];
    const rgbaColor: Color = [255, 0, 0, 255];

    describe('constructor', () => {
        test('should initialize with default wrap type', () => {
            const gradient = new ColorGradient(() => rgbColor);
            expect(gradient.get(0)).toEqual(rgbaColor);
        });

        test('should convert RGB to RGBA', () => {
            const gradient = new ColorGradient(() => rgbColor);
            expect(gradient.get(0)).toEqual(rgbaColor);
        });
    });

    describe('setWrapType', () => {
        let gradient: ColorGradient;

        beforeEach(() => {
            gradient = new ColorGradient((p) => [100 * p, 0, 100 - 100 * p, 255]);
        });

        test('should clamp values', () => {
            gradient.setWrapType('clamp');
            expect(gradient.get(-1)).toEqual(gradient.get(0));
            expect(gradient.get(2)).toEqual(gradient.get(1));
        });

        test('should repeat values', () => {
            gradient.setWrapType('repeat');
            expect(gradient.get(-0.1)).toBeCloseToArray(gradient.get(0.9));
            expect(gradient.get(1.1)).toBeCloseToArray(gradient.get(0.1));
            expect(gradient.get(-1.1)).toBeCloseToArray(gradient.get(0.9));
            expect(gradient.get(2.1)).toBeCloseToArray(gradient.get(0.1));
        });

        test('should mirror values', () => {
            gradient.setWrapType('mirror');
            expect(gradient.get(-0.1)).toBeCloseToArray(gradient.get(0.1));
            expect(gradient.get(1.1)).toBeCloseToArray(gradient.get(0.9));
            expect(gradient.get(-1.1)).toBeCloseToArray(gradient.get(0.9));
            expect(gradient.get(2.1)).toBeCloseToArray(gradient.get(0.1));
        });

        test('should make values transparent', () => {
            gradient.setWrapType('transparent');
            const transparentColor = [255, 0, 0, 0];
            expect(gradient.get(-1)[3]).toBe(0);
            expect(gradient.get(2)[3]).toBe(0);
        });
    });

    describe('createPreview', () => {
        test('should create preview with correct dimensions', () => {
            const gradient = new ColorGradient(() => rgbaColor);
            const preview = gradient.createPreview(10, 5);
            expect(preview.width).toBe(10);
            expect(preview.height).toBe(5);
        });

        test('should create preview with correct color values', () => {
            const gradient = new ColorGradient(() => rgbaColor);
            const preview = gradient.createPreview(10, 5);
            for (let x = 0; x < 10; x++) {
                for (let y = 0; y < 5; y++) {
                    expect(preview.get(x, y)).toEqual(rgbaColor);
                }
            }
        });
    });

    describe('toImage', () => {
        test('should create image with correct dimensions', () => {
            const gradient = new ColorGradient(() => rgbaColor);
            const image = gradient.toImage(10, 5);
            expect(image.width).toBe(10);
            expect(image.height).toBe(5);
        });
    });

    describe('static uniform', () => {
        test('should create gradient with correct interpolation', () => {
            const colors: ColorRGB[] = [[255, 0, 0], [0, 255, 0]];
            const gradient = ColorGradient.uniform(colors);
            expect(gradient.get(0)).toEqual([255, 0, 0, 255]);
            expect(gradient.get(1)).toEqual([0, 255, 0, 255]);
            expect(gradient.get(0.5)).toEqual([127.5, 127.5, 0, 255]);
        });

        test('should use custom interpolator', () => {
            const colors: ColorRGB[] = [[255, 0, 0], [0, 255, 0]];
            const interpolator = (t: number) => t * t;
            const gradient = ColorGradient.uniform(colors, interpolator);
            const blendedColor = blendColors([255, 0, 0], [0, 255, 0], interpolator(0.5));
            expect(gradient.get(0.5)).toEqual(blendedColor);
        });
    });
});