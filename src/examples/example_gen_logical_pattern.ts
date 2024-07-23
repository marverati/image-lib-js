
import { ImageLib } from "../image-lib";
import { save } from "./util";

const map = ImageLib.generate((x, y) => x & y, 512, 512);
save(map);