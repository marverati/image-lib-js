import { describe, test, expect } from '@jest/globals';
import { InterpolationType, Interpolators, Interpolator } from '../interpolation';

describe('Interpolators', () => {
    describe('Linear Interpolator', () => {
        test('should interpolate linearly between two values', () => {
            const interpolator: Interpolator = Interpolators[InterpolationType.Linear];
            expect(interpolator(0, 0, 10)).toBe(0);
            expect(interpolator(0.3, 10, 20)).toBeCloseTo(13);
            expect(interpolator(0.5, 0, 10)).toBe(5);
            expect(interpolator(1, 0, 10)).toBe(10);
            expect(interpolator(0.9, 6, 6)).toBe(6);
        });
    });

    describe('Cubic Interpolator', () => {
        test('should interpolate cubically between two values', () => {
            const interpolator: Interpolator = Interpolators[InterpolationType.Cubic];
            expect(interpolator(0, 0, 10)).toBe(0);
            expect(interpolator(0.3, 10, 20)).toBeLessThan(13);
            expect(interpolator(0.5, 0, 10)).toBeCloseTo(5, 1);
            expect(interpolator(1, 0, 10)).toBe(10);
            expect(interpolator(0.9, 6, 6)).toBe(6);
        });
    });

    describe('Sin Interpolator', () => {
        test('should interpolate using sine function between two values', () => {
            const interpolator: Interpolator = Interpolators[InterpolationType.Sin];
            expect(interpolator(0, 0, 10)).toBe(0);
            expect(interpolator(0.3, 10, 20)).toBeLessThan(13);
            expect(interpolator(0.5, 0, 10)).toBeCloseTo(5, 1);
            expect(interpolator(1, 0, 10)).toBe(10);
            expect(interpolator(0.9, 6, 6)).toBe(6);
        });
    });

    describe('Floor Interpolator', () => {
        test('should interpolate using floor function between two values', () => {
            const interpolator: Interpolator = Interpolators[InterpolationType.Floor];
            expect(interpolator(0, 0, 10)).toBe(0);
            expect(interpolator(0.3, 10, 20)).toBe(10);
            expect(interpolator(0.5, 0, 10)).toBe(0);
            expect(interpolator(1, 0, 10)).toBe(10);
            expect(interpolator(0.9, 6, 6)).toBe(6);
        });
    });

    describe('Ceil Interpolator', () => {
        test('should interpolate using ceil function between two values', () => {
            const interpolator: Interpolator = Interpolators[InterpolationType.Ceil];
            expect(interpolator(0, 0, 10)).toBe(0);
            expect(interpolator(0.3, 10, 20)).toBe(20);
            expect(interpolator(0.5, 0, 10)).toBe(10);
            expect(interpolator(1, 0, 10)).toBe(10);
            expect(interpolator(0.9, 6, 6)).toBe(6);
        });
    });

    describe('Nearest Interpolator', () => {
        test('should interpolate to the nearest value between two values', () => {
            const interpolator: Interpolator = Interpolators[InterpolationType.Nearest];
            expect(interpolator(0, 0, 10)).toBe(0);
            expect(interpolator(0.25, 0, 10)).toBe(0);
            expect(interpolator(0.5, 10, 20)).toBe(20);
            expect(interpolator(0.75, 0, 10)).toBe(10);
            expect(interpolator(1, 0, 10)).toBe(10);
            expect(interpolator(0.9, 6, 6)).toBe(6);
        });
    });

    describe('Stochastic Interpolator', () => {
        test('should interpolate stochastically between two values', () => {
            const interpolator: Interpolator = Interpolators[InterpolationType.Stochastic];
            const results = new Set<number>();
            for (let i = 0; i < 100; i++) {
                results.add(interpolator(0.5, 0, 10));
            }
            expect(results.has(0)).toBe(true);
            expect(results.has(10)).toBe(true);
            expect(results.size).toBe(2); // Should have exactly 0 and 10 in results
        });
    });
});