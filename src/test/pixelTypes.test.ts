import { describe, test, expect } from '@jest/globals';
import { BoolPixelMap, ColorMap, GrayscalePixelMap, RGBAPixelMap, RGBPixelMap } from '../image-lib';
import { Color } from '../PixelMap';

describe('RGBAPixelMap', () => {
  test('ColorMap is the same class', () => {
    expect(ColorMap).toBe(RGBAPixelMap);
  });

  test('defaults to transparent black', () => {
    expect(new RGBAPixelMap(2, 2).get(0, 0)).toEqual([0, 0, 0, 0]);
  });

  test('converts other value types when constructing', () => {
    expect(new RGBAPixelMap(1, 1, [1, 2, 3]).get(0, 0)).toEqual([1, 2, 3, 255]);
    expect(new RGBAPixelMap(1, 1, 50).get(0, 0)).toEqual([50, 50, 50, 255]);
    expect(new RGBAPixelMap(1, 1, true).get(0, 0)).toEqual([255, 255, 255, 255]);
    expect(new RGBAPixelMap(1, 1, () => 20).get(0, 0)).toEqual([20, 20, 20, 255]);
    expect(new RGBAPixelMap(1, 1, () => false).get(0, 0)).toEqual([0, 0, 0, 255]);
  });

  test('pixels built from a constant color do not share one array', () => {
    const map = new RGBAPixelMap(2, 1, [1, 2, 3, 4]);
    map.get(0, 0)[0] = 99;
    expect(map.get(1, 0)).toEqual([1, 2, 3, 4]);
  });

  test('fill converts values and does not share arrays', () => {
    const map = new RGBAPixelMap(2, 2);
    map.fill(128);
    expect(map.get(1, 1)).toEqual([128, 128, 128, 255]);
    map.fill([1, 2, 3, 4]);
    map.get(0, 0)[0] = 99;
    expect(map.get(1, 0)).toEqual([1, 2, 3, 4]);
    map.fill((x, y) => [x, y, 0]);
    expect(map.get(1, 0)).toEqual([1, 0, 0, 255]);
  });

  test('filter turns number results into gray pixels', () => {
    const map = new RGBAPixelMap(2, 2, [100, 50, 0, 255]);
    map.filter(c => c[0] / 2);
    expect(map.get(0, 0)).toEqual([50, 50, 50, 255]);
  });

  test('channel filters only touch their channel', () => {
    const map = new RGBAPixelMap(2, 2, [10, 20, 30, 40]);
    map.filterR(r => r + 1);
    map.filterG((g, c) => c[0]);
    map.filterB((b, c, x, y) => x + y);
    map.filterA(() => 255);
    expect(map.get(0, 0)).toEqual([11, 11, 0, 255]);
    expect(map.get(1, 1)).toEqual([11, 11, 2, 255]);
  });

  test('extract channels into grayscale maps', () => {
    const map = new RGBAPixelMap(2, 2, [10, 20, 30, 40]);
    expect(map.extractR().get(1, 1)).toBe(10);
    expect(map.extractG().get(1, 1)).toBe(20);
    expect(map.extractB().get(1, 1)).toBe(30);
    expect(map.extractA().get(1, 1)).toBe(40);
    expect(map.extractR()).toBeInstanceOf(GrayscalePixelMap);
  });

  test('toRGB puts transparent pixels on the background color', () => {
    const map = new RGBAPixelMap(3, 1, (x) => [[255, 0, 0, 255], [255, 0, 0, 0], [0, 0, 0, 127.5]][x] as Color);
    const rgb = map.toRGB([0, 0, 255]);
    expect(rgb).toBeInstanceOf(RGBPixelMap);
    expect(rgb.get(0, 0)).toEqual([255, 0, 0]);
    expect(rgb.get(1, 0)).toEqual([0, 0, 255]);
    expect(rgb.get(2, 0)).toBeCloseToArray([0, 0, 127.5]);
    // Default background is white
    expect(map.toRGB().get(1, 0)).toEqual([255, 255, 255]);
    expect(map.toRGB(10).get(1, 0)).toEqual([10, 10, 10]);
  });

  test('blend weighs colors by their alpha', () => {
    const map = new RGBAPixelMap(1, 1);
    expect(map.blend([0, 0, 0, 255], [200, 100, 0, 255], 0.5)).toBeCloseToArray([100, 50, 0, 255]);
    // A fully transparent color does not affect the RGB part
    expect(map.blend([0, 0, 0, 0], [200, 100, 0, 255], 0.5)).toBeCloseToArray([200, 100, 0, 127.5]);
  });

  test('clone copies pixels into a separate map', () => {
    const map = new RGBAPixelMap(2, 2, (x, y) => [x, y, 0, 255]);
    const copy = map.clone();
    copy.set(0, 0, [9, 9, 9, 9]);
    expect(map.get(0, 0)).toEqual([0, 0, 0, 255]);
    expect(copy.get(1, 1)).toEqual([1, 1, 0, 255]);
  });
});

describe('RGBPixelMap', () => {
  test('defaults to white', () => {
    expect(new RGBPixelMap(1, 1).get(0, 0)).toEqual([255, 255, 255]);
  });

  test('converts to RGBA and grayscale', () => {
    const map = new RGBPixelMap(2, 2, [100, 200, 50]);
    expect(map.toRGBA().get(0, 0)).toEqual([100, 200, 50, 255]);
    expect(map.toRGBA(10).get(0, 0)).toEqual([100, 200, 50, 10]);
    expect(map.toGrayscale().get(0, 0)).toBeCloseTo(0.2989 * 100 + 0.587 * 200 + 0.114 * 50);
    expect(map.toGrayscale(1, 0, 0).get(0, 0)).toBe(100);
  });

  test('toColor and fromColor', () => {
    const map = new RGBPixelMap(1, 1);
    expect(map.toColor([1, 2, 3])).toEqual([1, 2, 3, 255]);
    expect(map.fromColor([1, 2, 3, 4])).toEqual([1, 2, 3]);
  });

  test('blend interpolates linearly', () => {
    const map = new RGBPixelMap(1, 1);
    expect(map.blend([0, 0, 0], [100, 200, 50], 0.25)).toEqual([25, 50, 12.5]);
  });
});

describe('GrayscalePixelMap', () => {
  test('defaults to black', () => {
    expect(new GrayscalePixelMap(1, 1).get(0, 0)).toBe(0);
  });

  test('converts to RGB and RGBA', () => {
    const map = new GrayscalePixelMap(2, 2, 42);
    expect(map.toRGB().get(1, 1)).toEqual([42, 42, 42]);
    expect(map.toRGBA().get(1, 1)).toEqual([42, 42, 42, 255]);
  });

  test('fromColor uses luminance weights', () => {
    expect(GrayscalePixelMap.fromColor([255, 255, 255, 255])).toBeCloseTo(255);
    expect(GrayscalePixelMap.fromColor([0, 255, 0, 255])).toBeCloseTo(0.587 * 255);
  });
});

describe('BoolPixelMap', () => {
  test('defaults to false', () => {
    expect(new BoolPixelMap(1, 1).get(0, 0)).toBe(false);
  });

  test('converts to and from colors', () => {
    const map = new BoolPixelMap(1, 1);
    expect(map.toColor(true)).toEqual([255, 255, 255, 255]);
    expect(map.toColor(false)).toEqual([0, 0, 0, 255]);
    expect(BoolPixelMap.fromColor([200, 200, 200, 255])).toBe(true);
    expect(BoolPixelMap.fromColor([50, 50, 50, 255])).toBe(false);
  });

  test('blend picks the closer value', () => {
    const map = new BoolPixelMap(1, 1);
    expect(map.blend(false, true, 0.4)).toBe(false);
    expect(map.blend(false, true, 0.6)).toBe(true);
  });
});

describe('PixelMap operations', () => {
  test('filterBuffered reads from the unmodified image', () => {
    // Shift everything one pixel to the right
    const shift = (map: GrayscalePixelMap) => (v: number, x: number, y: number) => map.get(x - 1, y);
    const inPlace = new GrayscalePixelMap(4, 1, (x) => x + 1);
    inPlace.filter(shift(inPlace));
    // In-place filtering reads values that were already overwritten
    // (x = -1 is outside the image and returns the initial value, which is 1 here)
    expect([0, 1, 2, 3].map(x => inPlace.get(x, 0))).toEqual([1, 1, 1, 1]);

    const buffered = new GrayscalePixelMap(4, 1, (x) => x + 1);
    buffered.filterBuffered(shift(buffered));
    expect([0, 1, 2, 3].map(x => buffered.get(x, 0))).toEqual([1, 1, 2, 3]);
  });

  test('some stops at the first match', () => {
    const map = new GrayscalePixelMap(10, 10, (x, y) => x + y);
    let calls = 0;
    const found = map.some((x, y, v) => { calls++; return v === 3; });
    expect(found).toBe(true);
    expect(calls).toBe(4);
    expect(map.some((x, y, v) => v > 100)).toBe(false);
  });

  test('crop with offset reads the right region', () => {
    const map = new GrayscalePixelMap(10, 10, (x, y) => x + 10 * y);
    const cropped = map.crop(2, 3, 4, 2);
    expect(cropped.width).toBe(4);
    expect(cropped.height).toBe(2);
    expect(cropped.get(0, 0)).toBe(32);
    expect(cropped.get(3, 1)).toBe(45);
  });

  test('bicubic interpolation is not supported yet', () => {
    const map = new GrayscalePixelMap(2, 2);
    expect(() => map.setInterpolationMode('bicubic')).toThrow();
  });
});

describe('smooth scaling', () => {
  test('scaleSmooth averages blocks of pixels', () => {
    const map = new GrayscalePixelMap(8, 8, (x, y) => (x < 4 ? 0 : 100));
    const small = map.scaleSmooth(0.25);
    expect(small.width).toBe(2);
    expect(small.height).toBe(2);
    expect(small.get(0, 0)).toBeCloseTo(0);
    expect(small.get(1, 1)).toBeCloseTo(100);
  });

  test('scaleSmooth keeps the average brightness', () => {
    const map = new GrayscalePixelMap(30, 30, (x, y) => (x * 7 + y * 13) % 256);
    let sum = 0;
    map.forEach((x, y, v) => sum += v);
    const small = map.scaleSmooth(0.1);
    let smallSum = 0;
    small.forEach((x, y, v) => smallSum += v);
    expect(smallSum / 9).toBeCloseTo(sum / 900, 5);
  });

  test('scaleSmooth works for non-integer factors', () => {
    const map = new GrayscalePixelMap(10, 10, 50);
    const small = map.scaleSmooth(0.3);
    expect(small.width).toBe(3);
    small.forEach((x, y, v) => expect(v).toBeCloseTo(50));
  });

  test('scaleSmooth works for colors', () => {
    const map = new RGBAPixelMap(4, 4, (x) => (x < 2 ? [255, 0, 0, 255] : [0, 0, 255, 255]));
    const small = map.scaleSmooth(0.25);
    expect(small.get(0, 0)).toBeCloseToArray([127.5, 0, 127.5, 255]);
  });

  test('resizeSmooth hits the exact requested size', () => {
    const map = new GrayscalePixelMap(100, 100, 10);
    const small = map.resizeSmooth(33, 7);
    expect(small.width).toBe(33);
    expect(small.height).toBe(7);
    small.forEach((x, y, v) => expect(v).toBeCloseTo(10));
  });

  test('resizeSmooth falls back to regular resizing for small changes', () => {
    const map = new GrayscalePixelMap(10, 10, (x, y) => x + y);
    const a = map.resizeSmooth(6, 6), b = map.resize(6, 6);
    a.forEach((x, y, v) => expect(v).toBeCloseTo(b.get(x, y)));
  });
});
