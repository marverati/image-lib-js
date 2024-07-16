
import { ImageLib } from "../image-lib";
import { fractalPerlin2D, perlin2D } from "../utility/perlin";
import { show } from "./util";

const map = ImageLib.generate((x, y) => fractalPerlin2D(x / 64, y / 64, 7, 2, 0.6) * 255, 512, 512);
show(map);