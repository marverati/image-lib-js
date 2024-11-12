import { describe, test, expect } from '@jest/globals';
import { BoolPixelMap, ColorMap, GrayscalePixelMap } from '../image-lib';
import { absMod, clamp, mirrorOutsideRange } from '../utility/util';

describe('PixelMap', () => {
  test('has expected size', () => {
    const p1 = new ColorMap(20, 10);
    expect(p1.width).toBe(20);
    expect(p1.height).toBe(10);
    const p2 = new GrayscalePixelMap(140, 250);
    expect(p2.width).toBe(140);
    expect(p2.height).toBe(250);
    const p3 = new BoolPixelMap(3, 1999);
    expect(p3.width).toBe(3);
    expect(p3.height).toBe(1999);
    const p4 = new ColorMap(550);
    expect(p4.width).toBe(550);
    expect(p4.height).toBe(550);
  });

  test('applies initial value', () => {
    const p1 = new GrayscalePixelMap(50, 50, 213);
    expect(p1.getFast(0, 0)).toBe(213);
    expect(p1.getFast(49, 49)).toBe(213);
    expect(p1.getFast(30, 42)).toBe(213);
    const p2 = new BoolPixelMap(10, 10, true);
    expect(p2.getFast(0, 0)).toBe(true);
    expect(p2.getFast(5, 5)).toBe(true);
    const p3 = new ColorMap(100, 100, [200, 100, 50, 250]);
    expect(p3.getFast(41, 59)).toEqual([200, 100, 50, 250]);
  })

  test('clones initial value instead of reusing same reference', () => {
    const p1 = new ColorMap(10, 10, [10, 20, 30, 200]);
    expect(p1.getFast(3, 5)).toEqual(p1.getFast(8, 7));
    expect(p1.getFast(3, 5)).not.toBe(p1.getFast(8, 7));
  })

  describe('getFast', () => {
    test('throws error for out of bounds coordinates', () => {
      const p1 = new GrayscalePixelMap(50, 50, 213);
      let errors = 0;
      let undefineds = 0;
      const coords = [[-1, 0], [0, -1], [50, 0], [0, 50], [50, 50]];
      for (const [x, y] of coords) {
        try {
          const result = p1.getFast(x, y);
          if (result === undefined) {
            undefineds++;
          }
        } catch (e) {
          errors++;
        }
      }
      expect(errors + undefineds).toBe(coords.length);
    });

    test('throws error for non-integer coordinates', () => {
      const p1 = new GrayscalePixelMap(50, 50, 213);
      let errors = 0;
      let undefineds = 0;
      const coords = [[0.3, 0], [0, 0.7], [50.1, 0], [0, 50.9], [12.4, 3.3], [4, 0.3]];
      for (const [x, y] of coords) {
        try {
          const result = p1.getFast(x, y);
          if (result === undefined) {
            undefineds++;
          }
        } catch (e) {
          errors++;
        }
      }
      expect(errors + undefineds).toBe(coords.length);
    });
  });

  describe('wrap mode', () => {
    describe('clamp', () => {
      test('clamps to nearest edge', () => {
        const p1 = new GrayscalePixelMap(50, 70, (x, y) => x + y);
        p1.setWrapMode('clamp');
        const coords = [ -200, -1, 0, 1, 23, 49, 50, 51, 69, 70, 100, 200 ];
        for (const x of coords) {
          const cx = clamp(x, 0, 49);
          for (const y of coords) {
            const cy = clamp(y, 0, 69);
            const expected = cx + cy;
            expect(p1.get(x, y)).toBe(expected);
          }
        }
      });
    });
    describe('repeat', () => {
      test('repeats pattern', () => {
        const p1 = new GrayscalePixelMap(50, 70, (x, y) => x + y);
        p1.setWrapMode('repeat');
        const coords = [ -200, -1, 0, 1, 23, 49, 50, 51, 69, 70, 100, 200 ];
        for (const x of coords) {
          const cx = absMod(x, 50);
          for (const y of coords) {
            const cy = absMod(y, 70);
            const expected = cx + cy;
            expect(p1.get(x, y)).toBe(expected);
          }
        }
      });
    });
    describe('mirror', () => {
      test('mirrors pattern', () => {
        const p1 = new GrayscalePixelMap(50, 70, (x, y) => x + y);
        p1.setWrapMode('mirror');
        const coords = [ -200, -1, 0, 1, 23, 49, 50, 51, 69, 70, 100, 200 ];
        for (const x of coords) {
          const cx = mirrorOutsideRange(x, 0, 49);
          for (const y of coords) {
            const cy = mirrorOutsideRange(y, 0, 69);
            const expected = cx + cy;
            expect(p1.get(x, y)).toBe(expected);
          }
        }
      });
    });
    describe('initial', () => {
      test('returns initial value for out of bounds coordinates', () => {
        const p1 = new GrayscalePixelMap(50, 70, (x, y) => x + y);
        p1.setWrapMode('initial');
        const coords = [ -200, -1, 0, 1, 23, 49, 50, 51, 69, 70, 100, 200 ];
        for (const x of coords) {
          for (const y of coords) {
            if (x < 0 || y < 0 || x >= 50 || y >= 70) {
              expect(p1.get(x, y)).toBe(0);
            } else {
              expect(p1.get(x, y)).toBe(x + y);
            }
          }
        }
      });
    });
  });

  describe('interpolation mode', () => {
    describe('floor', () => {
      test('returns floor of coordinates', () => {
        const p1 = new GrayscalePixelMap(3, 3, (x, y) => x + y);
        p1.setInterpolationMode('floor');
        expect(p1.get(0, 0)).toBe(0);
        expect(p1.get(0.3, 0.7)).toBe(p1.get(0, 0));
        expect(p1.get(2.5, 1.3)).toBe(p1.get(2, 1));
      });
    });
    describe('nearest', () => {
      test('returns nearest integer coordinates', () => {
        const p1 = new GrayscalePixelMap(4, 3, (x, y) => x + y);
        p1.setInterpolationMode('nearest');
        expect(p1.get(0, 0)).toBe(0);
        expect(p1.get(0.3, 0.7)).toBe(p1.get(0, 1));
        expect(p1.get(2.5, 1.3)).toBe(p1.get(3, 1));
      });
    });
    describe('stochastic', () => {
      test('returns random nearby coordinates', () => {
        const p1 = new GrayscalePixelMap(4, 3, (x, y) => x + y);
        p1.setInterpolationMode('stochastic');
        const results = new Set();
        let i = 0;
        for (i = 0; i < 1000; i++) {
          results.add(p1.get(0.5, 0.5));
          if (results.size > 1) {
            break;
          }
        }
        expect(results.size).toBeGreaterThan(1);
      });
    });
    describe('bilinear', () => {
      test('returns bilinearly interpolated value', () => {
        const p1 = new GrayscalePixelMap(4, 3, (x, y) => x + y);
        p1.setInterpolationMode('bilinear');
        expect(p1.get(0, 0)).toBe(0);
        expect(p1.get(0.3, 0.7)).toBeCloseTo(1);
        expect(p1.get(2.5, 1.3)).toBeCloseTo(3.8);
      });
    });
  });
  
  describe('forEach', () => {
    test('iterates over all pixels', () => {
      const p1 = new GrayscalePixelMap(3, 2, (x, y) => x + y * 10);
      let count = 0, sum = 0;
      p1.forEach((x, y, value) => {
        count++;
        sum += value;
      });
      expect(count).toBe(6);
      expect(sum).toBe(36); // 0 + 1 + 2 + 10 + 11 + 12
    });
  });

  describe('fill', () => {
    test('fills with constant value', () => {
      const p1 = new GrayscalePixelMap(3, 2, 0);
      p1.fill(5);
      p1.forEach((x, y, value) => {
        expect(value).toBe(5);
      });
    });

    test('fills with generator function', () => {
      const p1 = new GrayscalePixelMap(3, 2, 0);
      p1.fill((x, y) => x + y);
      p1.forEach((x, y, value) => {
        expect(value).toBe(x + y);
      });
    });
  });

  describe('filter', () => {
    test('applies filter function', () => {
      const p1 = new GrayscalePixelMap(3, 2, (x, y) => x + y);
      p1.filter((v, x, y) => v * 2);
      p1.forEach((x, y, value) => {
        expect(value).toBe((x + y) * 2);
      });
    });
  });

  describe('crop', () => {
    test('crops to specified size', () => {
      const p1 = new GrayscalePixelMap(5, 5, (x, y) => x + y);
      const p2 = p1.crop(1, 1, 3, 3);
      expect(p2.width).toBe(3);
      expect(p2.height).toBe(3);
      p2.forEach((x, y, value) => {
        expect(value).toBe(x + y + 2);
      });
    });

    test('crops to specified size with default values', () => {
      const p1 = new GrayscalePixelMap(5, 5, (x, y) => x + y);
      const p2 = p1.crop(1, 1);
      expect(p2.width).toBe(4);
      expect(p2.height).toBe(4);
      p2.forEach((x, y, value) => {
        expect(value).toBe(x + y + 2);
      });
    });
  });

  describe('resize', () => {
    test('resizes to specified smaller size', () => {
      const p1 = new GrayscalePixelMap(6, 6, (x, y) => x + y);
      const p2 = p1.resize(3, 3);
      expect(p2.width).toBe(3);
      expect(p2.height).toBe(3);
      p2.forEach((x, y, value) => {
        expect(value).toBeCloseTo((x + y) * 2, -1.1);
      });
    });
    test('resizes to specified larger size', () => {
      const p1 = new GrayscalePixelMap(3, 3, (x, y) => x + y);
      const p2 = p1.resize(6, 6);
      expect(p2.width).toBe(6);
      expect(p2.height).toBe(6);
      p2.forEach((x, y, value) => {
        expect(value).toBeCloseTo((x + y) / 2, -1.1);
      });
    });
    test('resizes to very different size', () => {
      const p1 = new GrayscalePixelMap(3, 3, (x, y) => x + y);
      const p2 = p1.resize(10, 1);
      expect(p2.width).toBe(10);
      expect(p2.height).toBe(1);
      p2.forEach((x, y, value) => {
        expect(value).toBeCloseTo(x / 3, -1.1);
      });
    });
  });

  describe('resizeSmooth', () => {

  });

  describe('scale', () => {
    test('does same as resize with corresponding size for one parameter', () => {
      const p1 = new GrayscalePixelMap(6, 6, (x, y) => x + y);
      const p2 = p1.scale(0.5);
      expect(p2.width).toBe(3);
      expect(p2.height).toBe(3);
      const p3 = p1.resize(3, 3);
      p2.forEach((x, y, value) => {
        expect(value).toBeCloseTo(p3.get(x, y), 2);
      });
    });
    test('does same as resize with corresponding size for two parameters', () => {
      const p1 = new GrayscalePixelMap(8, 6, (x, y) => x + y);
      const p2 = p1.scale(0.75, 2);
      expect(p2.width).toBe(6);
      expect(p2.height).toBe(12);
      const p3 = p1.resize(6, 12);
      p2.forEach((x, y, value) => {
        expect(value).toBeCloseTo(p3.get(x, y), 2);
      });
    });
  });

  describe('scaleSmooth', () => {
    test('preserves values even for very small scaling factors', () => {
      const p1 = new GrayscalePixelMap(40, 40, (x, y) => 0);
      const coords = [ {x: 3, y: 10}, {x: 14, y: 14}, {x: 20, y: 1}, {x: 39, y: 39} ];
      for (const coord of coords) {
        // Set single pixel to stand out
        p1.set(coord.x, coord.y, 255);
        const p2 = p1.scaleSmooth(0.1);
        // Ensure that not all pixels are 0 (this would happen with naive scaling)
        let sum = 0;
        p2.forEach((x, y, value) => {
          sum += value;
        });
        expect(sum).toBeGreaterThan(0);
        expect(sum).toBeLessThan(3); // as 10x10 pixels will be summarized in 1, the pixel value of 255 should be roughly divided by 100
        // Reset single pixel
        p1.set(coord.x, coord.y, 0);
      }
    })
  });

  describe('clone', () => {

  });

  describe('toCanvas', () => {

  });

  describe('toImage', () => {

  });
});