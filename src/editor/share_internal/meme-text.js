// *** memeText ***
copy();

const text1 = param.text("Top Text", "", "Top text");
const text2 = param.text("Bottom Text", "", "Bottom text");

const fontSetting = param.slider("Font Size", 1, 0, 4, 0.01, true);
const fontSize = fontSetting * 0.05 * height;
const distance = param.slider("Offset", 0.1, 0, 0.5, 0.01, true);

renderText(text1, width / 2, height * distance, fontSize);
renderText(text2, width / 2, height * (1-distance), fontSize);


function renderText(text, x, y, size) {
  if (!text) { return; }

  context.font = `${size}px Arial`
  context.lineWidth = size / 10;
  context.strokeStyle = "black";
  context.fillStyle = "white";
  context.textAlign = "center";
  context.lineCap = "square";
  context.lineJoin = "bevel";
  context.textBaseline = "middle";

  context.strokeText(text, x, y);
  context.fillText(text, x, y);
}