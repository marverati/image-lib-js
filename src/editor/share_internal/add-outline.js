copy();

const passes = param.slider("Intensity", 1, 20, 5) ** 2;
const radius = param.slider("Radius", 1, 32, 3);
const color = param.color("Outline Color", "#ffffffff", true);

context.shadowColor = color;
context.shadowBlur = radius;

for (let i = 0; i < passes; i++) {
  context.drawImage(document.querySelector('#source-canvas'), 0, 0);
}