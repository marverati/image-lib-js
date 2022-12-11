
// TODO provide proper smooth noise implementation based on gradients

/**
 * This function just provides deterministic noise values (0 to 1) for given integer coordinates
 * @param x 
 * @param y 
 */
function noise2D(x: number, y: number) {
    // Calculate seed value using the given coordinates
    const seed = x * x + y * y + x * y + x + y;
    
    // Use seed value to generate a random noise value between 0 and 1
    const noise = 0.5 + 0.25 * (Math.sin(seed) + Math.cos(seed * 117));
    
    return noise;
}

export function perlin2D(x: number, y: number) {
    // Calculate the integer coordinates of the four corners of the given coordinates
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = x0 + 1;
    const y1 = y0 + 1;
    
    // Calculate the weights for the four corners
    const sx = x - x0;
    const sy = y - y0;
    const n0 = (1 - sx) * (1 - sy);
    const n1 = sx * (1 - sy);
    const n2 = (1 - sx) * sy;
    const n3 = sx * sy;
    
    // Calculate the dot product of the weights and the noise values at the four corners
    const noise = n0 * noise2D(x0, y0) + n1 * noise2D(x1, y0) + n2 * noise2D(x0, y1) + n3 * noise2D(x1, y1);
    
    // Return the noise value as a number between 0 and 1
    return noise;
}

export function fractalPerlin2D(x: number, y: number, layers = 1, freqF = 2, ampF = 0.5) {
    let amp = 1, ampSum = 0, result = 0, scale = 1, offX = 0, offY = 0;
    for (let i = 0; i < layers; i++) {
        ampSum += amp;
        result += amp * perlin2D(x * scale + offX, y * scale + offY);
        scale *= freqF;
        amp *= ampF;
        // Offsets are just to ensure different layers don't have obvious similarities (could still happen, this is not perfect)
        const old = offX;
        offX = offY;
        offY = -old;
        offX += 5320;
    }
    return result / ampSum;
}