import { describe, test, expect } from '@jest/globals';
import { Random } from '../Random';

describe('Random', () => {
    test('same seed gives the same sequence', () => {
        const a = new Random(42), b = Random.seed(42);
        for (let i = 0; i < 20; i++) {
            expect(a.uniform()).toBe(b.uniform());
        }
    });

    test('string seeds work and differ from each other', () => {
        const a = new Random('hello'), b = new Random('hello'), c = new Random('world');
        const first = a.uniform();
        expect(b.uniform()).toBe(first);
        expect(c.uniform()).not.toBe(first);
    });

    test('uniform() without arguments returns values in [0, 1)', () => {
        const rnd = new Random(1);
        const values = Array.from({ length: 1000 }, () => rnd.uniform());
        expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
        expect(Math.max(...values)).toBeLessThan(1);
        // Not all the same value
        expect(new Set(values).size).toBeGreaterThan(900);
    });

    test('uniform(from, to) stays in range', () => {
        const rnd = new Random(2);
        for (let i = 0; i < 1000; i++) {
            const v = rnd.uniform(-5, 5);
            expect(v).toBeGreaterThanOrEqual(-5);
            expect(v).toBeLessThan(5);
        }
    });

    test('uniformInt includes both ends', () => {
        const rnd = new Random(3);
        const seen = new Set<number>();
        for (let i = 0; i < 500; i++) {
            const v = rnd.uniformInt(2, 5);
            expect(Number.isInteger(v)).toBe(true);
            seen.add(v);
        }
        expect([...seen].sort()).toEqual([2, 3, 4, 5]);
    });

    test('uniformInt with one argument counts from 0', () => {
        const rnd = new Random(4);
        const seen = new Set<number>();
        for (let i = 0; i < 200; i++) seen.add(rnd.uniformInt(2));
        expect([...seen].sort()).toEqual([0, 1, 2]);
    });

    test('choice picks elements of the array', () => {
        const rnd = new Random(5);
        const options = ['a', 'b', 'c'];
        const seen = new Set<string>();
        for (let i = 0; i < 100; i++) seen.add(rnd.choice(options));
        expect([...seen].sort()).toEqual(options);
    });

    test('gaussian has roughly the requested mean and deviation', () => {
        const rnd = new Random(6);
        const n = 5000;
        const values = Array.from({ length: n }, () => rnd.gaussian(10, 2));
        const mean = values.reduce((a, b) => a + b, 0) / n;
        const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
        expect(mean).toBeCloseTo(10, 0);
        expect(Math.sqrt(variance)).toBeCloseTo(2, 0);
    });
});
