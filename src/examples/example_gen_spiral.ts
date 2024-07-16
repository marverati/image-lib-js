
import { ImageLib } from "../image-lib";
import { show } from "./util";

const map = ImageLib.generateRadial((angle, distance) => 127.5 + 127.5 * Math.sin(3 * angle + 0.1 * distance), 512, 512);
show(map);