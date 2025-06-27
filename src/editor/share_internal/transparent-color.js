copy()

// Parameter
const color = param.color('Transparent Color', '#000000');
const hard_tol = param.slider('Tolerance', 0, 1, 0, 1 / 768) * 768;
const soft_tol = param.slider('Soft Tolerance', 0, 1, 0, 1 / 768) * 768;

const sum_tol = hard_tol + soft_tol;

filter(c => {
  const dr = Math.abs(c[0] - color[0]);
  const dg = Math.abs(c[1] - color[1]);
  const db = Math.abs(c[2] - color[2]);
  const diff = dr + dg + db;
  if (diff <= hard_tol) {
    // Hard transparent
    c[3] = 0;
  } else if (diff < sum_tol) {
    // Soft transparent
    const alphaFactor = (diff - hard_tol) / soft_tol;
    c[3] *= alphaFactor;
  }
  return c;
});
