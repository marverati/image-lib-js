


/**
 * Creates a home button that links to the root of the current website.
 * 
 * @param {Object} [options] - Configuration options
 * @param {'top-left'|'top-right'|'bottom-left'|'bottom-right'} [options.anchor='top-left'] - Corner position of the button
 * @param {boolean} [options.fixed=false] - If true, button is fixed to viewport; if false, positioned absolute in body
 * @param {boolean} [options.dark=false] - If true, uses dark mode styling (dark bg, light icon); if false, light mode
 * @param {number} [options.size=32] - Button size in pixels (icon scales proportionally to ~60% of this)
 * @returns {HTMLAnchorElement} The created button element (for later removal/modification if needed)
 * 
 * @example
 * // Default: top-left, absolute positioning, light mode, 40px
 * createHomeButton();
 * 
 * @example
 * // Bottom-right corner, fixed to viewport, dark mode, larger size
 * createHomeButton({ anchor: 'bottom-right', fixed: true, dark: true, size: 48 });
 * 
 * @example
 * // Remove the button later
 * const btn = createHomeButton();
 * btn.remove();
 */
export function createHomeButton(options: { anchor?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'; fixed?: boolean; dark?: boolean; size?: number } = {}) {
  const {
    anchor = 'top-left',
    fixed = false,
    dark = false,
    size = 40
  } = options;

  const btn = document.createElement('a');
  btn.href = '/';
  btn.title = 'Return to main page';
  
  const positions = {
    'top-left': { top: '12px', left: '12px' },
    'top-right': { top: '12px', right: '12px' },
    'bottom-left': { bottom: '12px', left: '12px' },
    'bottom-right': { bottom: '12px', right: '12px' }
  };
  const pos = positions[anchor] || positions['top-left'];

  const bg = dark ? '#333' : '#fff';
  const fg = dark ? '#eee' : '#333';
  const hoverBg = dark ? '#444' : '#f0f0f0';
  const border = dark ? '#555' : '#ccc';

  Object.assign(btn.style, {
    position: fixed ? 'fixed' : 'absolute',
    ...pos,
    width: size + 'px',
    height: size + 'px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: '6px',
    cursor: 'pointer',
    textDecoration: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'background 0.15s, transform 0.15s',
    zIndex: '9999'
  });

  const iconSize = Math.round(size * 0.6);
  btn.innerHTML = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${fg}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>`;

  btn.onmouseenter = () => {
    btn.style.background = hoverBg;
    btn.style.transform = 'scale(1.05)';
  };
  btn.onmouseleave = () => {
    btn.style.background = bg;
    btn.style.transform = 'scale(1)';
  };

  document.body.appendChild(btn);
  return btn;
}