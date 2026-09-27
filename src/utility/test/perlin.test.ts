import { describe, test, expect } from '@jest/globals';
import { fractalPerlin2D, perlin2D } from '../perlin';

describe('perlin2D', () => {
    test('is deterministic', () => {
        expect(perlin2D(1.3, 4.7)).toBe(perlin2D(1.3, 4.7));
    });

    test('stays within [0, 1]', () => {
        for (let y = 0; y < 20; y += 0.37) {
            for (let x = 0; x < 20; x += 0.41) {
                const v = perlin2D(x, y);
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThanOrEqual(1);
            }
        }
    });

    test('is 0.5 on integer grid points', () => {
        expect(perlin2D(0, 0)).toBeCloseTo(0.5);
        expect(perlin2D(3, 7)).toBeCloseTo(0.5);
    });

    test('is continuous', () => {
        const d = 1e-4;
        for (const [x, y] of [[0.5, 0.5], [2.99, 1.2], [10.01, 3.3]]) {
            expect(Math.abs(perlin2D(x + d, y) - perlin2D(x, y))).toBeLessThan(0.01);
        }
    });

    test('actually varies', () => {
        const values = new Set<number>();
        for (let i = 0; i < 50; i++) values.add(Math.round(perlin2D(i * 0.3, i * 0.7) * 100));
        expect(values.size).toBeGreaterThan(10);
    });
});

describe('fractalPerlin2D', () => {
    test('with one layer equals perlin2D', () => {
        expect(fractalPerlin2D(1.3, 2.4)).toBeCloseTo(perlin2D(1.3, 2.4));
    });

    test('with several layers stays within [0, 1]', () => {
        for (let i = 0; i < 200; i++) {
            const v = fractalPerlin2D(i * 0.13, i * 0.29, 5);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(1);
        }
    });
});
