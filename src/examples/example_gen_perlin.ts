
import { ImageLib } from "../image-lib";
import { perlin2D } from "../utility/perlin";
import { save } from "./util";

const map = ImageLib.generate((x, y) => perlin2D(x / 32, y / 32) * 255, 512, 512);
save(map);