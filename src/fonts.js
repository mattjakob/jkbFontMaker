const FALLBACK_FONTS = [
  'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia',
  'Verdana', 'Comic Sans MS', 'Impact', 'Trebuchet MS', 'Palatino',
  'Garamond', 'Bookman', 'Avant Garde', 'Futura', 'Geneva',
  'Optima', 'Didot', 'American Typewriter', 'Baskerville',
  'Menlo', 'Monaco', 'SF Mono', 'SF Pro', 'Helvetica Neue',
];

async function getSystemFonts() {
  try {
    if ('queryLocalFonts' in window) {
      const fonts = await window.queryLocalFonts();
      const families = [...new Set(fonts.map(f => f.family))];
      return families.sort();
    }
  } catch (e) {
    // Permission denied or unsupported
  }
  return FALLBACK_FONTS;
}

export { getSystemFonts, FALLBACK_FONTS };
