/**
 * A class for generating random numbers with a given seed.
 */
export class Random {
    private seed: number;
    private currentSeed: number;

    /**
     * Creates an instance of the Random class.
     * @param seed - The initial seed for the random number generator. Can be a number or a string.
     */
    constructor(seed: number | string) {
        this.seed = this.hashSeed(seed);
        this.currentSeed = this.seed;
        // Warm up the generator to improve randomness for nearby seeds
        for (let i = 0; i < 10; i++) {
            this.random();
        }
    }

    public static seed(seed: number | string): Random {
        return new Random(seed);
    }

    /**
     * Hashes the seed to ensure it is a number.
     * @param seed - The seed to hash. Can be a number or a string.
     * @returns A hashed numeric seed.
     */
    private hashSeed(seed: number | string): number {
        if (typeof seed === 'number') {
            return seed;
        }
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    /**
     * Generates a pseudo-random number between 0 (inclusive) and 1 (exclusive).
     * This method is private and used internally by other methods.
     * @returns A pseudo-random number between 0 and 1.
     */
    private random(): number {
        // Linear Congruential Generator (LCG) parameters
        const a = 1664525;
        const c = 1013904223;
        const m = 2 ** 32;

        this.currentSeed = (a * this.currentSeed + c) % m;
        return this.currentSeed / m;
    }

    /**
     * Generates a random floating-point number between the specified min (inclusive) and max (exclusive).
     * @param from - The minimum value (inclusive). Default is 0.
     * @param max - The maximum value (exclusive). Default is 1.
     * @returns A random floating-point number between min and max.
     */
    public uniform(from: number = 0, to: number = 0): number {
        return from + this.random() * (to - from);
    }

    /**
     * Generates a random integer between the specified min (inclusive) and max (inclusive).
     * @param min - The minimum value (inclusive).
     * @param max - The maximum value (inclusive).
     * @returns A random integer between min and max.
     */
    public uniformInt(min: number, max?: number): number {
        if (max == null) {
            max = min;
            min = 0;
        }
        return Math.floor(this.uniform(min, max + 1));
    }

    /**
     * Selects a random element from the given array.
     * @param array - The array to select a random element from.
     * @returns A random element from the array.
     */
    public choice<T>(array: T[]): T {
        const index = this.uniformInt(0, array.length - 1);
        return array[index];
    }

    /**
     * Generates a random number following a Gaussian (normal) distribution with the specified mean and standard deviation.
     * @param mean - The mean of the distribution. Default is 0.
     * @param stdDev - The standard deviation of the distribution. Default is 1.
     * @returns A random number following a Gaussian distribution.
     */
    public gaussian(mean: number = 0, stdDev: number = 1): number {
        let u = 0, v = 0;
        while (u === 0) u = this.random(); // Convert [0,1) to (0,1)
        while (v === 0) v = this.random(); // Convert [0,1) to (0,1)
        const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return mean + num * stdDev;
    }

    public logGaussian(mean: number, logStdDev: number): number {
        const normalValue = this.gaussian(mean, logStdDev);
        return Math.exp(normalValue);
    }
}

export const random = new Random(0);
