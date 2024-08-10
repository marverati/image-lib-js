
/*

Nice textures:
- [X] apply lighting / generateLightOverlay (25m)
- [x] lava (25m)
- [X] displace based on angle+distance rather than x+y (15m)
- [X] rust (20m)
- [ ] 3D brick (20m)
*/


import { GrayscalePixelMap, ImageLib } from "../image-lib";
import { clamp } from "../utility/util";
import { overlay } from "./example_combine_overlay";
import { filterGrayscale } from "./example_filter_grayscale";
import { save, load } from "./util";

export function getLightOverlay(
    heightmap: GrayscalePixelMap,
    lx: number = 0,
    ly: number = 0,
    lz: number = 1,
    shadowStrength = 0.5,
    specularStrength = 1,
    specularPower = 8,
): GrayscalePixelMap {
    // Normalize light vector
    const len = Math.sqrt(lx * lx + ly * ly + lz * lz);
    lx /= len;
    ly /= len;
    lz /= len;
    return ImageLib.filter(heightmap, (_c, x: number, y: number) => {
        const dx = heightmap.get(x + 1, y) - heightmap.get(x - 1, y);
        const dy = heightmap.get(x, y + 1) - heightmap.get(x, y - 1);
        // Calculate normal vector, orthogonal to surface
        const nx = -dx;
        const ny = -dy;
        const nz = 1;
        // Get length for normalization
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        // Dot product between light vector and normal vector
        const dot = 0.5 + 0.5 * clamp((nx * lx + ny * ly + nz * lz) / len, -1, 1);
        // Return
        const result = 127.5 // neutral base overlay value
            - 127.5 * (1 - dot) * shadowStrength // diffuse shadow
            + 127.5 * Math.pow(dot, specularPower) * specularStrength; // specular highlight
        return result;
    });
}


require.main === module && load('result').then(map => {
    const heightmap = filterGrayscale(map);
    const result = getLightOverlay(heightmap, 1, 1, 1);
    save(result, "filtered");
    const other = overlay(map, result.toRGBA());
    save(other, "filtered2");
})
