import opentype from 'opentype.js';
import { strokeToOutline } from './outline.js';
import { getAllGlyphs } from './glyphs.js';

export function exportFont(fontName, strokeWidth) {
  const unitsPerEm = 1000;
  const ascender = 800;
  const descender = -200;

  // Required .notdef glyph
  const notdefGlyph = new opentype.Glyph({
    name: '.notdef',
    unicode: 0,
    advanceWidth: 650,
    path: new opentype.Path(),
  });

  // Space glyph
  const spaceGlyph = new opentype.Glyph({
    name: 'space',
    unicode: 32,
    advanceWidth: 400,
    path: new opentype.Path(),
  });

  const glyphs = [notdefGlyph, spaceGlyph];

  // Stroke width in normalized space: e.g., 8px / 200px canvas = 0.04
  const normalizedStrokeWidth = (strokeWidth || 8) / 200;

  const allGlyphs = getAllGlyphs();
  for (const glyph of allGlyphs) {
    if (!glyph.strokes || !glyph.strokes.length) continue;

    const path = new opentype.Path();

    for (const stroke of glyph.strokes) {
      if (stroke.length < 2) continue;

      const outline = strokeToOutline(stroke, normalizedStrokeWidth, unitsPerEm);
      if (outline.length < 3) continue;

      // Y is flipped: font coords are Y-up (0 at baseline), our coords are Y-down (0 at top)
      path.moveTo(outline[0].x, unitsPerEm - outline[0].y);
      for (let i = 1; i < outline.length; i++) {
        path.lineTo(outline[i].x, unitsPerEm - outline[i].y);
      }
      path.close();
    }

    const unicode = glyph.char.charCodeAt(0);
    const name = unicode >= 33 && unicode <= 126
      ? glyph.char
      : 'uni' + unicode.toString(16).toUpperCase().padStart(4, '0');

    glyphs.push(new opentype.Glyph({
      name,
      unicode,
      advanceWidth: 650,
      path,
    }));
  }

  const font = new opentype.Font({
    familyName: fontName || 'MyFont',
    styleName: 'Regular',
    unitsPerEm,
    ascender,
    descender,
    glyphs,
  });

  // Trigger download
  const sanitizedName = (fontName || 'MyFont').replace(/[^a-zA-Z0-9]/g, '');
  font.download(sanitizedName + '.otf');
}
