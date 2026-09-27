# image-lib-js

A small TypeScript library for editing images one pixel at a time, plus a browser editor built on top of it.

The library is based on one idea: an image is a function from `(x, y)` to a color. You generate an image by writing that function, filter one by mapping each pixel to a new value, and combine two by mapping pairs of pixels. None of this is fast compared to a shader or a native library. It is easy to play with, though, and that's the point.

```ts
import { ImageLib } from "./src/image-lib";

// Classic XOR pattern, 512×512, RGB
const xor = ImageLib.generate((x, y) => [x % 256, y % 256, (x ^ y) % 256]);

// Invert it
const inverted = ImageLib.filter(xor, c => [255 - c[0], 255 - c[1], 255 - c[2]]);
```

## What's in here

- **The library** (`src/image-lib.ts`, `src/PixelMap.ts`): pixel maps plus helpers to generate, filter, combine, crop, resize and scale them.
- **The editor** (`src/editor/`): a page where you write short JavaScript snippets against a source image and see the result right away. This is the part you'll probably spend the most time in.
- **Demos** (`src/demo/`): an older version of the editor, a Julia set explorer, and the login/register pages.
- **Examples** (`src/examples/`): standalone scripts for generators, filters and blend modes. They double as a collection of recipes.
- **Utilities** (`src/utility/`): Perlin noise, HSL conversion, color gradients, a seeded RNG, interpolation.

## Getting started

```sh
npm install
npm run dev:editor
```

Parcel serves the editor at http://localhost:1234. Other entry points:

| Command               | Opens                                                    |
| --------------------- | -------------------------------------------------------- |
| `npm run dev:editor`  | The editor (regenerates the example list first)          |
| `npm run editor`      | The editor, without regenerating the examples            |
| `npm run dev`         | `src/index.html`, a plain page linking to everything     |
| `npm run demo`        | The old demo page                                        |

## The library

### Pixel maps

`PixelMap<T>` is a 2D grid of values of type `T`. There are four concrete types:

| Class               | Pixel value                        |
| ------------------- | ---------------------------------- |
| `RGBAPixelMap`      | `[r, g, b, a]`, each 0–255         |
| `RGBPixelMap`       | `[r, g, b]`                        |
| `GrayscalePixelMap` | a single number, 0–255             |
| `BoolPixelMap`      | `true` / `false`                   |

`ColorMap` is an alias for `RGBAPixelMap`.

You rarely need to choose one yourself. `ImageLib.generate`, `filter` and `combine` look at what your function returns and pick the matching type: return a number and you get a grayscale map, return a 3-element array and you get RGB, and so on.

```ts
const noise  = ImageLib.generate(() => Math.random() * 255, 256, 256); // GrayscalePixelMap
const mask   = ImageLib.filter(noise, v => v > 128);                   // BoolPixelMap
const tinted = ImageLib.filter(noise, v => [v, v * 0.6, 0]);           // RGBPixelMap
```

The default size is 512×512. You can change it with `ImageLib.setDefaultSize(w, h)`.

### Working with a map

```ts
map.get(x, y)          // sampled read (see wrap and interpolation modes below)
map.set(x, y, value)
map.fill(valueOrFn)
map.filter(fn)         // in place
map.filterBuffered(fn) // in place, but reads from an untouched copy
map.forEach((x, y, v) => ...)
map.crop(x0, y0, w, h)
map.resize(w, h)       // also resizeSmooth
map.scale(fx, fy)      // also scaleSmooth
map.toCanvas()
map.toImage()
```

Use `filterBuffered` when your filter reads neighbouring pixels (blurs, displacement and so on). Otherwise you'll read pixels you've already overwritten.

RGBA maps also have per-channel filters (`filterR`, `filterG`, `filterB`, `filterA`) and extractors (`extractR()` and friends) that return grayscale maps. The conversions go the way you'd expect: `toRGB()`, `toRGBA()`, `toGrayscale()`.

### Sampling outside the image, and between pixels

`get` accepts fractional and out-of-range coordinates. How those are handled depends on two settings:

- `setWrapMode("clamp" | "repeat" | "mirror" | "initial")`: what you get outside the image. `"initial"`, the default, returns the value the map was created with.
- `setInterpolationMode("floor" | "nearest" | "bilinear" | "bicubic" | "stochastic")`: how in-between positions are sampled. The default is `"bilinear"`.

This is what keeps displacement and distortion filters short. You compute where to read from and call `get`.

### Combining images

```ts
const multiplied = ImageLib.combine(a, b, (ca, cb) => [
    ca[0] * cb[0] / 255,
    ca[1] * cb[1] / 255,
    ca[2] * cb[2] / 255,
    ca[3] * cb[3] / 255,
]);
```

If the two maps differ in size, `b` is stretched to fit `a` by default.

## The editor

The editor has a source image on the left, a target on the right, a row of numbered slots along the top, and a code panel. You drop or paste an image into the source (or into any slot), write a snippet, and press **Ctrl+Enter** to run it.

Snippets are plain JavaScript. Here is a basic one:

```js
copy();  // source → target
filter(c => [255 - c[0], 255 - c[1], 255 - c[2], c[3]]);
```

The snippet API covers most of what the library offers, but works on image IDs rather than map objects. `0` is the source, `-1` is the target, and `1`–`9` are the slots.

| Function                     | Does                                                        |
| ---------------------------- | ----------------------------------------------------------- |
| `use(id)`                    | Makes `id` the target for following calls                   |
| `copy(from, to)`             | Copies an image (with no arguments: source → target)        |
| `copyFrom(id)` / `copyTo(id)`| Copies into / out of the current target                     |
| `gen(fn, [w], [h])`          | Generates a new image from `(x, y) => color`                |
| `fill(color)`                | Fills with a single color                                   |
| `filter(fn)`                 | Maps each pixel `(color, x, y) => color`                    |
| `filterR/G/B/A(fn)`          | Maps one channel                                            |
| `resize`, `rescale`, `crop`  | Changes the size                                            |
| `mirror()`, `flip()`         | Mirrors horizontally, flips vertically                      |

`width`, `height`, `canvas` and `context` are also in scope, so you can draw on the target with the regular Canvas 2D API when that's easier than working pixel by pixel. So are a few helpers: `perlin2D`, `fractalPerlin2D`, `clamp`, `mapRange`, `ColorGradient` and others.

### Parameters

Snippets can ask for inputs. These appear as controls next to the code and re-run the snippet when you change them:

```js
const strength = param.slider("Strength", 0.5, 0, 1, 0.01, true);
const tint     = param.color("Tint", "#ff8800");
const invert   = param.toggle("Invert");
```

The other controls are `number`, `text`, `select` and `button`.

### Other things worth knowing

- **F1** opens the help overlay. Holding it shows the overlay only until you let go.
- Lines that start with `//>` are treated as documentation for the snippet. The 👁️ button switches between the code and its docs.
- The file tree on the left has three sections. *User* holds your own snippets, which autosave. *Public* is under `src/editor/share_internal/`. *Examples* comes from `src/editor/examples_raw.js`. To edit one of the read-only scripts, use *Make a Copy*.
- Every script has a URL like `?script=examples:spiral`, so you can link to it directly.
- The help overlay has a *Copy prompting template* button. It copies a description of the API to your clipboard, which is handy if you want an LLM to write snippets for you.

Snippets are stored in `localStorage`. There is also a backend storage path, used after you log in, but the server isn't part of this repo.

### Adding examples

Built-in examples are functions in `src/editor/examples_raw.js`, and public scripts are `.js` files in `src/editor/share_internal/`. After changing either, run `npm run process-examples`, which rebuilds the JSON the editor loads. `npm run dev:editor` and `npm run build:editor` already do this for you.

## Running the example scripts in Node

The scripts in `src/examples/` also run outside the browser. They use [`node-canvas`](https://github.com/Automattic/node-canvas) for image I/O. It isn't listed in `package.json`, so install it first:

```sh
npm install canvas
npx ts-node src/examples/example_gen_perlin.ts
```

Output goes to `output/`. Some filters read from earlier results (`output/result.png`, for example), so run a generator first.

## Building

```sh
npm run build:editor   # or: npm run dist
```

This writes a standalone editor to `dist/editor/`. It uses relative paths only, so it keeps working when served from a subfolder.

## Tests

```sh
npm test            # Jest unit tests (pixel maps, color utilities, interpolation)
npm run test:e2e    # Playwright tests against the editor; starts the dev server itself
```

## License

ISC, according to `package.json`.
