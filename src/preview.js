import { getGlyph } from './glyphs.js';
import { getCharAdvance, getSpaceAdvance } from './fonts.js';

export class Preview {
  constructor(canvas, input) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;
    this.referenceFont = 'Arial';
    this.kerning = 0;
    this.strokeWidth = 8;

    this.input.addEventListener('input', () => this.render());
    window.addEventListener('glyph-updated', () => this.render());
    window.addEventListener('resize', () => this.render());
  }

  setReferenceFont(font) {
    this.referenceFont = font;
    this.render();
  }

  setKerning(kerning) {
    this.kerning = kerning;
    this.render();
  }

  setStrokeWidth(w) {
    this.strokeWidth = w;
    this.render();
  }

  render() {
    const text = this.input.value || '';
    const ctx = this.ctx;

    // Size canvas to container
    const container = this.canvas.parentElement;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = rect.width;
    const canvasHeight = 80;

    this.canvas.width = canvasWidth * dpr;
    this.canvas.height = canvasHeight * dpr;
    this.canvas.style.width = canvasWidth + 'px';
    this.canvas.style.height = canvasHeight + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    const glyphSize = 60;
    const baseline = 10;
    const spaceAdvance = glyphSize * (getSpaceAdvance() + this.kerning) / 1000;
    let x = 0;

    for (const char of text) {
      if (char === ' ') {
        x += spaceAdvance;
        continue;
      }

      const glyph = getGlyph(char);
      const leftBearing = (glyph.bearingLeft || 0);
      const rightBearing = (glyph.bearingRight || 0);
      const charAdvance = getCharAdvance(char);
      const advance = glyphSize * (charAdvance + this.kerning + leftBearing + rightBearing) / 1000;

      if (glyph && glyph.strokes && glyph.strokes.length > 0) {
        // Strokes are in em-square normalized coords (0-1), centered in the editor.
        // Shift so the advance's left edge in the em square maps to cursor position x.
        const emLeftEdge = (1000 - (charAdvance + this.kerning)) / 2 - leftBearing;
        const drawX = x - glyphSize * emLeftEdge / 1000;
        this._drawGlyphStrokes(ctx, glyph.strokes, drawX, baseline, glyphSize);
      } else {
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.font = `${glyphSize}px "${this.referenceFont}"`;
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'top';
        const leftOffset = glyphSize * leftBearing / 1000;
        ctx.fillText(char, x + leftOffset, baseline);
        ctx.restore();
      }

      x += advance;
    }
  }

  _drawGlyphStrokes(ctx, strokes, offsetX, offsetY, size) {
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = this.strokeWidth * (size / 200);

    for (const stroke of strokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(offsetX + stroke[0].x * size, offsetY + stroke[0].y * size);
      for (let i = 1; i < stroke.length - 1; i++) {
        const xc = (stroke[i].x + stroke[i + 1].x) / 2 * size + offsetX;
        const yc = (stroke[i].y + stroke[i + 1].y) / 2 * size + offsetY;
        ctx.quadraticCurveTo(
          stroke[i].x * size + offsetX,
          stroke[i].y * size + offsetY,
          xc, yc
        );
      }
      const last = stroke[stroke.length - 1];
      ctx.lineTo(offsetX + last.x * size, offsetY + last.y * size);
      ctx.stroke();
    }
    ctx.restore();
  }
}
