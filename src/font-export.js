import opentype from 'opentype.js';
import { glyphToContours, TRACE_SIZE } from './contour.js';
import { getAllGlyphs } from './glyphs.js';

export function exportFont(fontName, strokeWidth) {
  const unitsPerEm = 1000;
  const ascender = 800;
  const descender = -200;

  const notdefGlyph = new opentype.Glyph({
    name: '.notdef',
    unicode: 0,
    advanceWidth: 650,
    path: new opentype.Path(),
  });

  const spaceGlyph = new opentype.Glyph({
    name: 'space',
    unicode: 32,
    advanceWidth: 400,
    path: new opentype.Path(),
  });

  const glyphs = [notdefGlyph, spaceGlyph];
  const scale = unitsPerEm / TRACE_SIZE;

  const allGlyphs = getAllGlyphs();
  for (const glyph of allGlyphs) {
    if (!glyph.strokes || !glyph.strokes.length) continue;

    const contours = glyphToContours(glyph.strokes, strokeWidth);
    const path = new opentype.Path();

    for (const contour of contours) {
      if (contour.length < 3) continue;

      path.moveTo(
        contour[0].x * scale,
        unitsPerEm - contour[0].y * scale
      );
      for (let i = 1; i < contour.length; i++) {
        path.lineTo(
          contour[i].x * scale,
          unitsPerEm - contour[i].y * scale
        );
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

  const sanitizedName = (fontName || 'MyFont').replace(/[^a-zA-Z0-9]/g, '');
  font.download(sanitizedName + '.otf');
}
