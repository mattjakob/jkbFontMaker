import { getGlyph } from './glyphs.js';

export class Preview {
  constructor(canvas, input) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = input;
    this.referenceFont = 'Arial';

    this.input.addEventListener('input', () => this.render());
    window.addEventListener('glyph-updated', () => this.render());
    window.addEventListener('resize', () => this.render());
  }

  setReferenceFont(font) {
    this.referenceFont = font;
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
    let x = 0;

    for (const char of text) {
      if (char === ' ') {
        x += glyphSize * 0.5;
        continue;
      }

      const glyph = getGlyph(char);
      if (glyph && glyph.strokes && glyph.strokes.length > 0) {
        // Draw the glyph strokes scaled to preview size
        this._drawGlyphStrokes(ctx, glyph.strokes, x, baseline, glyphSize);
      } else {
        // Fallback: draw with reference font, faded
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.font = `${glyphSize}px "${this.referenceFont}"`;
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'top';
        ctx.fillText(char, x, baseline);
        ctx.restore();
      }

      x += glyphSize * 0.65;
    }
  }

  _drawGlyphStrokes(ctx, strokes, offsetX, offsetY, size) {
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;

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
