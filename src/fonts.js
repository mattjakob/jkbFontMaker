const REFERENCE_FONTS = [
  'EB Garamond',
  'Fira Code',
  'Futura',
  'Helvetica',
  'Libre Baskerville',
  'Libre Caslon Text',
  'Optima',
  'Palatino',
  'SF Pro',
  'Times New Roman',
];

async function getSystemFonts() {
  return REFERENCE_FONTS;
}

// --- Reference font metrics (module state) ---
// Measured at 1000px CSS font size so widths are in 1000-unit em space.

const _measureCtx = document.createElement('canvas').getContext('2d');
let _metrics = null;

function setReferenceFont(fontFamily, chars) {
  _measureCtx.font = `1000px "${fontFamily}"`;
  const widths = {};
  let total = 0;
  for (const char of chars) {
    const w = _measureCtx.measureText(char).width;
    widths[char] = Math.round(w);
    total += w;
  }
  // Space advance from the reference font
  const spaceWidth = Math.round(_measureCtx.measureText(' ').width);
  _metrics = { widths, average: Math.round(total / chars.length), spaceWidth };
}

function getCharAdvance(char) {
  if (_metrics && _metrics.widths[char] !== undefined) {
    return _metrics.widths[char];
  }
  return _metrics ? _metrics.average : 650;
}

function getSpaceAdvance() {
  return _metrics ? _metrics.spaceWidth : 250;
}

export { getSystemFonts, setReferenceFont, getCharAdvance, getSpaceAdvance, REFERENCE_FONTS as FALLBACK_FONTS };
