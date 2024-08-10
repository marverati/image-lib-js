import { rgbToHsl, rgbaToHsla, hslToRgb, hslaToRgba } from '../HSL';

describe('rgbToHsl', () => {
    test('converts pure red', () => {
        expect(rgbToHsl([255, 0, 0])).toEqual([0, 100, 50]);
    });

    test('converts pure green', () => {
        expect(rgbToHsl([0, 255, 0])).toEqual([120, 100, 50]);
    });

    test('converts pure blue', () => {
        expect(rgbToHsl([0, 0, 255])).toEqual([240, 100, 50]);
    });

    test('converts white', () => {
        expect(rgbToHsl([255, 255, 255])).toEqual([0, 0, 100]);
    });

    test('converts black', () => {
        expect(rgbToHsl([0, 0, 0])).toEqual([0, 0, 0]);
    });

    test('converts grey', () => {
        expect(rgbToHsl([128, 128, 128])).toEqual([0, 0, 50]);
    });

    test('converts same RGB values', () => {
        expect(rgbToHsl([123, 123, 123])).toEqual([0, 0, 48]);
    });
});

describe('rgbaToHsla', () => {
    test('converts pure red with alpha', () => {
        expect(rgbaToHsla([255, 0, 0, 255])).toEqual([0, 100, 50, 255]);
    });

    test('converts pure green with alpha', () => {
        expect(rgbaToHsla([0, 255, 0, 128])).toEqual([120, 100, 50, 128]);
    });

    test('converts pure blue with alpha', () => {
        expect(rgbaToHsla([0, 0, 255, 0])).toEqual([240, 100, 50, 0]);
    });

    test('converts same RGBA values', () => {
        expect(rgbaToHsla([123, 123, 123, 123])).toEqual([0, 0, 48, 123]);
    });
});

describe('hslToRgb', () => {
    test('converts pure red', () => {
        expect(hslToRgb([0, 100, 50])).toEqual([255, 0, 0]);
    });

    test('converts pure green', () => {
        expect(hslToRgb([120, 100, 50])).toEqual([0, 255, 0]);
    });

    test('converts pure blue', () => {
        expect(hslToRgb([240, 100, 50])).toEqual([0, 0, 255]);
    });

    test('converts white', () => {
        expect(hslToRgb([0, 0, 100])).toEqual([255, 255, 255]);
    });

    test('converts black', () => {
        expect(hslToRgb([0, 0, 0])).toEqual([0, 0, 0]);
    });

    test('converts grey', () => {
        expect(hslToRgb([0, 0, 50])).toEqual([128, 128, 128]);
    });

    test('converts same HSL values', () => {
        expect(hslToRgb([0, 0, 48])).toEqual([122, 122, 122]);
    });

    test('wraps hue', () => {
        const hues = [-400, -360, -240, -120, -1, 0, 1, 120, 240, 360, 400];
        for (const hue of hues) {
            expect(hslToRgb([hue, 100, 50])).toEqual(hslToRgb([hue + 360, 100, 50]));
            expect(hslToRgb([hue, 100, 50])).toEqual(hslToRgb([hue - 360, 100, 50]));
        }
    });
});

describe('hslaToRgba', () => {
    test('converts pure red with alpha', () => {
        expect(hslaToRgba([0, 100, 50, 250])).toEqual([255, 0, 0, 250]);
    });

    test('converts pure green with alpha', () => {
        expect(hslaToRgba([120, 100, 50, 128])).toEqual([0, 255, 0, 128]);
    });

    test('converts pure blue with alpha', () => {
        expect(hslaToRgba([240, 100, 50, 0])).toEqual([0, 0, 255, 0]);
    });

    test('converts same HSLA values', () => {
        expect(hslaToRgba([0, 0, 48, 125])).toEqual([122, 122, 122, 125]);
    });
});