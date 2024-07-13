
// Enum of interpolation types
export enum InterpolationType {
    Linear = "linear",
    Cubic = "cubic",
    Sin = "sin",
    CatmullRom = "catmullrom",
    Floor = "floor",
    Ceil = "ceil",
    Nearest = "nearest",
    Stochastic = "stochastic",
}

export type Interpolator = (t: number, a?: number, b?: number) => number;

export const Interpolators: Record<InterpolationType, Interpolator> = {
    [InterpolationType.Linear]: (t, a = 0, b = 1) => a + (b - a) * t,
    [InterpolationType.Cubic]: (t, a = 0, b = 1) => a + (b - a) * (3 * t * t - 2 * t * t * t),
    [InterpolationType.Sin]: (t, a = 0, b = 1) => a + (b - a) * 0.5 * (1 - Math.cos(t * Math.PI)),
    [InterpolationType.CatmullRom]: (t, a = 0, b = 1) => a + (b - a) * 0.5 * (t * (2 + t * (3 + t))),
    [InterpolationType.Floor]: (t, a = 0, b = 1) => t < 1 ? a : b,
    [InterpolationType.Ceil]: (t, a = 0, b = 1) => t > 0 ? b : a,
    [InterpolationType.Nearest]: (t, a = 0, b = 1) => t < 0.5 ? a : b,
    [InterpolationType.Stochastic]: (t, a = 0, b = 1) => t < Math.random() ? a : b,
};