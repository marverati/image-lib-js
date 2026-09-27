import { describe, test, expect, afterEach } from '@jest/globals';
import { BoolPixelMap, GrayscalePixelMap, ImageLib, RGBAPixelMap, RGBPixelMap } from '../image-lib';

describe('ImageLib', () => {
  afterEach(() => {
    ImageLib.setDefaultSize();
  });

  describe('generate', () => {
    test('picks the pixel map type from the generator result', () => {
      expect(ImageLib.generate(() => [1, 2, 3, 4], 2, 2)).toBeInstanceOf(RGBAPixelMap);
      expect(ImageLib.generate(() => [1, 2, 3], 2, 2)).toBeInstanceOf(RGBPixelMap);
      expect(ImageLib.generate(() => 7, 2, 2)).toBeInstanceOf(GrayscalePixelMap);
      expect(ImageLib.generate(() => true, 2, 2)).toBeInstanceOf(BoolPixelMap);
    });

    test('accepts constant values instead of functions', () => {
      const map = ImageLib.generate([10, 20, 30], 3, 2);
      expect(map).toBeInstanceOf(RGBPixelMap);
      expect(map.get(2, 1)).toEqual([10, 20, 30]);
    });

    test('passes pixel coordinates to the generator', () => {
      const map = ImageLib.generate((x, y) => x * 10 + y, 4, 3);
      expect(map.get(0, 0)).toBe(0);
      expect(map.get(3, 2)).toBe(32);
    });

    test('uses the default size when none is given', () => {
      const map = ImageLib.generate(0);
      expect(map.width).toBe(512);
      expect(map.height).toBe(512);
    });

    test('setDefaultSize changes the default size', () => {
      ImageLib.setDefaultSize(20, 10);
      const map = ImageLib.generate(0);
      expect(map.width).toBe(20);
      expect(map.height).toBe(10);
      ImageLib.setDefaultSize(8);
      expect(ImageLib.generate(0).height).toBe(8);
    });

    test('gen is an alias for generate', () => {
      const map = ImageLib.gen(() => 5, 2, 2);
      expect(map).toBeInstanceOf(GrayscalePixelMap);
      expect(map.get(1, 1)).toBe(5);
    });
  });

  describe('generateRadial', () => {
    test('passes angle and distance from the image center', () => {
      const map = ImageLib.generateRadial((angle, dist) => dist, 10, 10);
      expect(map.get(5, 5)).toBeCloseTo(0);
      expect(map.get(8, 5)).toBeCloseTo(3);
      expect(map.get(5, 1)).toBeCloseTo(4);
      const angles = ImageLib.generateRadial((angle) => angle, 10, 10);
      expect(angles.get(8, 5)).toBeCloseTo(0);
      expect(angles.get(5, 8)).toBeCloseTo(Math.PI / 2);
    });
  });

  describe('filter', () => {
    test('creates a new map and leaves the input untouched', () => {
      const input = new GrayscalePixelMap(3, 3, 100);
      const output = ImageLib.filter(input, v => v / 2);
      expect(output.get(1, 1)).toBe(50);
      expect(input.get(1, 1)).toBe(100);
    });

    test('can change the pixel type', () => {
      const input = new GrayscalePixelMap(3, 3, (x) => x * 100);
      const mask = ImageLib.filter(input, v => v > 150);
      expect(mask).toBeInstanceOf(BoolPixelMap);
      expect(mask.get(1, 0)).toBe(false);
      expect(mask.get(2, 0)).toBe(true);
      const colored = ImageLib.filter(input, v => [v, 0, 0, 255]);
      expect(colored).toBeInstanceOf(RGBAPixelMap);
      expect(colored.get(2, 2)).toEqual([200, 0, 0, 255]);
    });

    test('passes coordinates to the mapping', () => {
      const input = new GrayscalePixelMap(4, 4, 0);
      const output = ImageLib.filter(input, (v, x, y) => x + 10 * y);
      expect(output.get(3, 2)).toBe(23);
    });
  });

  describe('combine', () => {
    test('maps pairs of pixels for equally sized maps', () => {
      const a = new GrayscalePixelMap(4, 4, (x) => x);
      const b = new GrayscalePixelMap(4, 4, (x, y) => y * 10);
      const sum = ImageLib.combine(a, b, (va, vb) => va + vb);
      expect(sum).toBeInstanceOf(GrayscalePixelMap);
      expect(sum.get(3, 2)).toBe(23);
    });

    test('uses the size of the first map', () => {
      const a = new GrayscalePixelMap(6, 3, 0);
      const b = new GrayscalePixelMap(2, 2, 0);
      const result = ImageLib.combine(a, b, (va, vb) => va + vb);
      expect(result.width).toBe(6);
      expect(result.height).toBe(3);
    });

    test('stretches the second map to fit by default', () => {
      const a = new GrayscalePixelMap(5, 5, 0);
      const b = new GrayscalePixelMap(2, 2, (x, y) => x * 100 + y * 10);
      const result = ImageLib.combine(a, b, (va, vb) => vb);
      // Corners of a map to corners of b, the middle is interpolated
      expect(result.get(0, 0)).toBeCloseTo(0);
      expect(result.get(4, 0)).toBeCloseTo(100);
      expect(result.get(4, 4)).toBeCloseTo(110);
      expect(result.get(2, 2)).toBeCloseTo(55);
    });

    test('can use absolute coordinates instead of stretching', () => {
      const a = new GrayscalePixelMap(5, 5, 0);
      const b = new GrayscalePixelMap(2, 2, 7);
      const combine = ImageLib.combine as any;
      const result = combine.call(ImageLib, a, b, (va: number, vb: number) => vb, false);
      expect(result.get(1, 1)).toBe(7);
      // Outside of b, its initial value is used
      expect(result.get(4, 4)).toBe(7);
    });
  });
});
