
copy();
const white = param.color('white', '#ffffff');
const black = param.color('black', '#000000');
const whiteScale = param.slider('white correction', 0, 0, 1, 0.001);
const blackScale = param.slider('black correction', 0, 0, 1, 0.001);
const dr = white[0] - black[0];
const dg = white[1] - black[1];
const db = white[2] - black[2];
const br = black[0] + dr * blackScale;
const bg = black[1] + dg * blackScale;
const bb = black[2] + db * blackScale;
const wr = white[0] - dr * whiteScale;
const wg = white[1] - dg * whiteScale;
const wb = white[2] - db * whiteScale;
const rFactor = 255 / (wr - br);
const gFactor = 255 / (wg - bg);
const bFactor = 255 / (wb - bb);
filter(c => {
    // Apply white correction
    c[0] = (c[0] - br) * rFactor;
    c[1] = (c[1] - bg) * gFactor;
    c[2] = (c[2] - bb) * bFactor;
    return c;
});
//> This tool is useful for correcting e.g. photographs of paper write-ups or whiteboard sketches.
//> Ideally proceed as follows:
//> 1. Load the image you want to edit by dropping it onto the page.
//> 2. Use the "white" and "black" color pickers to select the darkest color that shall be white, and the brightest color that shall be black.
//> 3. If the adjustment is insufficient, increase the correction sliders until you like the result.