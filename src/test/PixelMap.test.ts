import { describe, test, expect } from '@jest/globals';
import { BoolPixelMap, ColorMap, GrayscalePixelMap } from '../image-lib';

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

    });

    test('throws error for non-integer coordinates', () => {

    });
  });

  describe('wrap mode', () => {

  });

  describe('interpolation mode', () => {

  });

  describe('forEach', () => {

  });

  describe('fill', () => {

  });

  describe('filter', () => {

  });

  describe('crop', () => {

  });

  describe('resize', () => {

  });

  describe('resizeSmooth', () => {

  });

  describe('scale', () => {

  });

  describe('scaleSmooth', () => {

  });

  describe('clone', () => {

  });

  describe('toCanvas', () => {

  });

  describe('toImage', () => {

  });
});