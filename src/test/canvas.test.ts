import { describe, test, expect } from '@jest/globals';
import { BoolPixelMap, GrayscalePixelMap, ImageLib, RGBAPixelMap, RGBPixelMap } from '../image-lib';
import ColorGradient from '../utility/ColorGradient';

/**
 * Integration tests that go through a real canvas. In Node, this uses the optional "canvas"
 * package. Without it, these tests are skipped locally, but they must run in CI.
 */
const hasNodeCanvas = (() => {
  try {
    require('canvas');
    return true;
  } catch (e) {
    return false;
  }
})();

if (!hasNodeCanvas && process.env.CI) {
  throw new Error('The optional "canvas" package is required for tests in CI');
}

const describeWithCanvas = hasNodeCanvas ? describe : describe.skip;

describeWithCanvas('canvas integration', () => {
  test('createCanvas and createCanvasContext use the requested size', () => {
    const cnv = ImageLib.createCanvas(12, 7);
    expect(cnv.width).toBe(12);
    expect(cnv.height).toBe(7);
    const ctx = ImageLib.createCanvasContext(3, 4);
    expect(ctx.canvas.width).toBe(3);
  });

  test('RGBA map survives a round trip through a canvas', () => {
    const map = new RGBAPixelMap(8, 5, (x, y) => [x * 30, y * 50, 100, 255]);
    const cnv = map.toCanvas();
    expect(cnv.width).toBe(8);
    expect(cnv.height).toBe(5);
    const back = RGBAPixelMap.fromCanvas(cnv);
    expect(back.width).toBe(8);
    expect(back.height).toBe(5);
    back.forEach((x, y, c) => expect(c).toEqual(map.get(x, y)));
  });

  test('toCanvas renders other pixel types as colors', () => {
    const gray = RGBAPixelMap.fromCanvas(new GrayscalePixelMap(2, 2, 77).toCanvas());
    expect(gray.get(1, 1)).toEqual([77, 77, 77, 255]);
    const rgb = RGBAPixelMap.fromCanvas(new RGBPixelMap(2, 2, [1, 2, 3]).toCanvas());
    expect(rgb.get(1, 1)).toEqual([1, 2, 3, 255]);
    const bool = RGBAPixelMap.fromCanvas(new BoolPixelMap(2, 1, (x) => x === 1).toCanvas());
    expect(bool.get(0, 0)).toEqual([0, 0, 0, 255]);
    expect(bool.get(1, 0)).toEqual([255, 255, 255, 255]);
  });

  test('toCanvas resizes a given canvas to fit', () => {
    const cnv = ImageLib.createCanvas(1, 1);
    const result = new GrayscalePixelMap(6, 4, 0).toCanvas(cnv);
    expect(result).toBe(cnv);
    expect(cnv.width).toBe(6);
    expect(cnv.height).toBe(4);
  });

  test('fromImage works for all pixel types', () => {
    const source = new RGBAPixelMap(3, 2, (x) => [[255, 0, 0, 255], [0, 255, 0, 255], [255, 255, 255, 255]][x] as any);
    const img = source.toImage();
    expect(img.width).toBe(3);

    expect(RGBAPixelMap.fromImage(img).get(1, 0)).toEqual([0, 255, 0, 255]);
    expect(RGBPixelMap.fromImage(img).get(0, 1)).toEqual([255, 0, 0]);
    const gray = GrayscalePixelMap.fromImage(img);
    expect(gray.width).toBe(3);
    expect(gray.get(2, 0)).toBeCloseTo(255);
    const bool = BoolPixelMap.fromImage(img);
    expect(bool.get(0, 0)).toBe(false);
    expect(bool.get(2, 1)).toBe(true);
  });

  test('ColorGradient.toImage creates an image of the right size', () => {
    const image = new ColorGradient(() => [255, 0, 0, 255]).toImage(10, 5);
    expect(image.width).toBe(10);
    expect(image.height).toBe(5);
  });
});
