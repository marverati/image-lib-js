
import { ImageLib } from "../image-lib";
import { save } from "./util";

export const genColorfulTrig = () => ImageLib.generate((x, y) => {
    const r = Math.sin(x / 16) * 127.5 + 127.5;
    const g = Math.sin(y / 23) * 127.5 + 127.5;
    const b = Math.sin((x + y) / 25) * 127.5 + 127.5;
    return [r, g, b, 255];
});

require.main === module && (async () => {
    const result = genColorfulTrig();
    save(result, "result");
})();