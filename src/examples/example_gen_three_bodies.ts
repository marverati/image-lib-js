
import { mapRange } from "../demo/util";
import { ImageLib } from "../image-lib";
import { show } from "./util";

const FORCE_FACTOR = 0.1;
const ITERATIONS = 500;

class Particle {
    constructor(public x: number, public y: number, public vx: number, public vy: number) {
    }
}
const particles = [
    new Particle(0, 0, 0, 0),
    new Particle(0, 0, 0, 0),
    new Particle(0, 0, 0, 0),
];

const initialPositions = [
    { x: 0, y: 0 }, // will depend on coordinates
    { x: -10, y: -10 },
    { x: 10, y: 10 },
];

const width = 512;
const height = width;

const zoom = 1;
const viewX = 0;
const viewY = 0;

const map = ImageLib.generate((x, y) => {
    const px = viewX + (2 * x - width) / width / zoom;
    const py = viewY + (2 * y - height) / height / zoom;
    // Reset particles
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x = initialPositions[i].x;
        p.y = initialPositions[i].y;
        p.vx = 0;
        p.vy = 0;
    }
    particles[0].x = -10 + 20 * px;
    particles[0].y = 10 - 20 * py;
    // Iterate
    for (let i = 0; i < ITERATIONS; i++) {
        updateParticles(particles);
    }
    // Draw
    const distances = particles.map(p => mapRange(Math.sqrt(p.x * p.x + p.y * p.y), 0, 20, 255, 0));
    return [distances[0], distances[1], distances[2]];
    // const angle = Math.atan2(particles[0].y, particles[0].x);
    // return mapRange(angle, -Math.PI, Math.PI, 0, 255);
}, width, height);
show(map);

function updateParticles(particles: Particle[]) {
    // Update forces
    for (let i = 1; i < particles.length; i++) {
        for (let j = 0; j < i; j++) {
            updateParticlePair(particles[i], particles[j]);
        }
    }
    // Move particles
    for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
    }
}

function updateParticlePair(p1: Particle, p2: Particle) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const d = 1 + Math.sqrt(dx * dx + dy * dy);
    const f = FORCE_FACTOR / (d * d);
    const fx = f * dx;
    const fy = f * dy;
    p1.vx += fx;
    p1.vy += fy;
    p2.vx -= fx;
    p2.vy -= fy;
}