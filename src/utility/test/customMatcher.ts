import { expect } from '@jest/globals';

expect.extend({
  toBeCloseToArray(received: number[], expected: number[], precision = 2) {
    if (received.length !== expected.length) {
      return {
        message: () => `Expected arrays to have the same length`,
        pass: false,
      };
    }

    const tolerance = Math.pow(10, -precision) / 2;
    for (let i = 0; i < received.length; i++) {
      if (Math.abs(received[i] - expected[i]) > tolerance) {
        return {
          message: () => `Expected ${received[i]} to be close to ${expected[i]} at index ${i}`,
          pass: false,
        };
      }
    }

    return {
      message: () => `Expected arrays to not be close to each other`,
      pass: true,
    };
  },
});
