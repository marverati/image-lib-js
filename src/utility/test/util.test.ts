import { describe, test, expect } from '@jest/globals';
import { blendColors, averageColors, mapRange, getRangeMapper, clamp, absMod } from '../util';
import { Color, ColorRGB } from '../../PixelMap';

describe('Utility Functions', () => {
    describe('blendColors', () => {
        test('should blend two colors correctly', () => {
            const colorA = [255, 0, 0, 255] as Color; // Red
            const colorB = [0, 0, 255, 255] as Color; // Blue
            const t = 0.5;
            const blended = blendColors(colorA, colorB, t);
            expect(blended).toEqual([127.5, 0, 127.5, 255]);
        });

        test('should handle missing alpha values', () => {
            const colorA = [255, 0, 0] as ColorRGB; // Red
            const colorB = [0, 0, 255] as ColorRGB; // Blue
            const t = 0.5;
            const blended = blendColors(colorA, colorB, t);
            expect(blended).toEqual([127.5, 0, 127.5, 255]);
        });

        test('should handle edge case where t is 0', () => {
            const colorA = [255, 0, 0, 255] as Color; // Red
            const colorB = [0, 0, 255, 255] as Color; // Blue
            const t = 0;
            const blended = blendColors(colorA, colorB, t);
            expect(blended).toEqual([255, 0, 0, 255]);
        });

        test('should handle edge case where t is 1', () => {
            const colorA = [255, 0, 0, 255] as Color; // Red
            const colorB = [0, 0, 255, 255] as Color; // Blue
            const t = 1;
            const blended = blendColors(colorA, colorB, t);
            expect(blended).toEqual([0, 0, 255, 255]);
        });
    });

    describe('averageColors', () => {
        test('should average multiple colors correctly', () => {
            const colors: Color[] = [
                [255, 0, 0, 255], // Red
                [0, 255, 0, 255], // Green
                [0, 0, 255, 255], // Blue
            ];
            const averaged = averageColors(colors);
            expect(averaged).toEqual([85, 85, 85, 255]);
        });

        test('should handle missing alpha values', () => {
            const colors: ColorRGB[] = [
                [255, 0, 0], // Red
                [0, 255, 0], // Green
                [0, 0, 255], // Blue
            ];
            const averaged = averageColors(colors);
            expect(averaged).toEqual([85, 85, 85, 255]);
        });

        test('should handle a single color', () => {
            const colors: Color[] = [
                [255, 0, 0, 255], // Red
            ];
            const averaged = averageColors(colors);
            expect(averaged).toEqual([255, 0, 0, 255]);
        });
    });

    describe('mapRange', () => {
        test('should map a value from one range to another', () => {
            const result = mapRange(5, 0, 10, 0, 100);
            expect(result).toBe(50);
        });

        test('should clamp the result if clampResult is true', () => {
            const result = mapRange(15, 0, 10, 0, 100, true);
            expect(result).toBe(100);
        });

        test('should handle reverse ranges', () => {
            const result = mapRange(5, 0, 10, 100, 0);
            expect(result).toBe(50);
        });

        test('should handle edge case where fromMin equals fromMax', () => {
            const result = mapRange(5, 5, 5, 0, 100);
            expect(result).toBe(NaN); // Division by zero
        });
    });

    describe('getRangeMapper', () => {
        test('should behave identically ro mapRange', () => {
            const mappings = [
                [0, 10, 0, 100],
                [0, 10, 100, 0],
                [0, 10, 50, 200],
                [-5, 5, -50, -20],
            ] as [number, number, number, number][];
            const values = [-51, -10, -1, 0, 1, 2, 5, 10, 20, 100, 250];
            for (const mapping of mappings) {
                for (const value of values) {
                    for (const clampResult of [false, true]) {
                        const result1 = mapRange(value, ...mapping, clampResult);
                        const result2 = getRangeMapper(...mapping, clampResult)(value);
                        expect(result2).toBeCloseTo(result1);
                    }
                }
            }
        });

        test('should return a function that maps a value from one range to another', () => {
            const mapper = getRangeMapper(0, 10, 0, 100);
            expect(mapper(0)).toBe(0);
            expect(mapper(5)).toBe(50);
            expect(mapper(10)).toBe(100);
            const mapper2 = getRangeMapper(0, 10, 100, 200);
            expect(mapper2(0)).toBe(100);
            expect(mapper2(5)).toBe(150);
            expect(mapper2(10)).toBe(200);
        });

        test('should clamp the result if clampResult is true', () => {
            const mapper = getRangeMapper(0, 10, 0, 100, true);
            expect(mapper(15)).toBe(100);
        });

        test('should handle reverse ranges', () => {
            const mapper = getRangeMapper(0, 10, 100, 0);
            expect(mapper(5)).toBe(50);
        });

        test('should handle edge case where fromMin equals fromMax', () => {
            const mapper = getRangeMapper(5, 5, 0, 100);
            expect(mapper(5)).toBe(NaN); // Division by zero
        });
    });

    describe('clamp', () => {
        test('should clamp a value to the given range', () => {
            expect(clamp(5, 0, 10)).toBe(5);
            expect(clamp(-5, 0, 10)).toBe(0);
            expect(clamp(15, 0, 10)).toBe(10);
        });
    });

    describe('absMod', () => {
        test('should return the absolute modulus of a value', () => {
            expect(absMod(5, 3)).toBe(2);
            expect(absMod(-5, 3)).toBe(1);
            expect(absMod(5, -3)).toBe(-1);
            expect(absMod(-5, -3)).toBe(-2);
        });

        test('should handle edge case where modulus is zero', () => {
            expect(absMod(5, 0)).toBe(NaN); // Division by zero
        });
    });
});

