
import { ImageLib } from "../image-lib";
import { ColorRGB } from "../PixelMap";
import { show } from "./util";

const STEPS = 1000;
const STEP_SIZE = 0.4;

const spheres = [
    {x: -10, y: 0, z: 40, r: 10},
    {x: 15, y: -20, z: 120, r: 20},
    {x: 2, y: 30, z: 160, r: 30},
];

const map = ImageLib.generate((x, y) => {
    const rayDX = (x - 256) / 512 * STEP_SIZE;
    const rayDY = (y - 256) / 512 * STEP_SIZE;
    const rayDZ = STEP_SIZE;
    const color = getRaytracingResult(0, 0, 0, rayDX, rayDY, rayDZ);
    return color;
}, 512, 512);
show(map);

function getRaytracingResult(x: number, y: number, z: number, dx: number, dy: number, dz: number): ColorRGB {
    for (let s = 0; s < STEPS; s++) {
        for (const sphere of spheres) {
            const t = isPointInSphere(x, y, z, sphere.x, sphere.y, sphere.z, sphere.r);
            if (t) {
                // Move to sphere surface
                const disToSphere = Math.sqrt((x - sphere.x) ** 2 + (y - sphere.y) ** 2 + (z - sphere.z) ** 2);
                x = sphere.x + (x - sphere.x) / disToSphere * sphere.r;
                y = sphere.y + (y - sphere.y) / disToSphere * sphere.r;
                z = sphere.z + (z - sphere.z) / disToSphere * sphere.r;

                // Calculate normal vector at the point of contact
                const nx = (x - sphere.x) / sphere.r;
                const ny = (y - sphere.y) / sphere.r;
                const nz = (z - sphere.z) / sphere.r;

                // Calculate dot product of direction vector and normal vector
                const dot = dx * nx + dy * ny + dz * nz;

                // Reflect the direction vector off the sphere surface
                dx = dx - 2 * dot * nx;
                dy = dy - 2 * dot * ny;
                dz = dz - 2 * dot * nz;
            }
        }
        // Move on
        x += dx;
        y += dy;
        z += dz;
    }
    // Generate color based on final coordinate
    const dis = Math.sqrt(x * x + y * y + z * z);
    const f = 1 / Math.max(dis, 0.001);
    x *= f;
    y *= f;
    z *= f;
    return [127.5 + 127.5 * x, 127.5 + 127.5 * y, 127.5 + 127.5 * z];
}

function isPointInSphere(x: number, y: number, z: number, cx: number, cy: number, cz: number, r: number): boolean {
    return ((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2) <= r * r;
}