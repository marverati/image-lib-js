
import { ImageLib } from "../image-lib";
import { show } from "./util";

const map = ImageLib.generate((x, y) => x & y, 512, 512);
show(map);