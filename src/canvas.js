export class DrawingEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.strokes = [];        // completed strokes: array of arrays of {x,y}
    this.currentStroke = null; // in-progress stroke
    this.strokeWidth = options.strokeWidth || 8;
    this.strokeColor = options.strokeColor || '#fff';
    this.referenceGlyph = null;
    this.referenceFont = null;
    this.isDrawing = false;

    this._onStart = this._onStart.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onEnd = this._onEnd.bind(this);

    this._bindEvents();
  }

  _bindEvents() {
    this.canvas.addEventListener('pointerdown', this._onStart);
    this.canvas.addEventListener('pointermove', this._onMove);
    this.canvas.addEventListener('pointerup', this._onEnd);
    this.canvas.addEventListener('pointerleave', this._onEnd);
    this.canvas.style.touchAction = 'none';
  }

  _getPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }

  _onStart(e) {
    this.isDrawing = true;
    this.currentStroke = [this._getPoint(e)];
    this.canvas.setPointerCapture(e.pointerId);
  }

  _onMove(e) {
    if (!this.isDrawing || !this.currentStroke) return;
    this.currentStroke.push(this._getPoint(e));
    this.render();
  }

  _onEnd(e) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    if (this.currentStroke && this.currentStroke.length >= 2) {
      this.strokes.push(this.currentStroke);
    }
    this.currentStroke = null;
    this.render();
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    this._drawReference();

    // Draw completed strokes
    for (const stroke of this.strokes) {
      this._drawStroke(stroke);
    }
    // Draw current stroke in progress
    if (this.currentStroke && this.currentStroke.length >= 2) {
      this._drawStroke(this.currentStroke);
    }
  }

  _drawReference() {
    if (!this.referenceGlyph || !this.referenceFont) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    const fontSize = h * 0.7;
    ctx.font = `${fontSize}px "${this.referenceFont}"`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.referenceGlyph, w / 2, h / 2);
    ctx.restore();
  }

  _drawStroke(points) {
    if (points.length < 2) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();
    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = this.strokeWidth * (w / 200); // scale stroke width relative to canvas
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(points[0].x * w, points[0].y * h);

    // Quadratic curve interpolation for smooth lines
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2 * w;
      const yc = (points[i].y + points[i + 1].y) / 2 * h;
      ctx.quadraticCurveTo(points[i].x * w, points[i].y * h, xc, yc);
    }
    // Line to last point
    const last = points[points.length - 1];
    ctx.lineTo(last.x * w, last.y * h);

    ctx.stroke();
    ctx.restore();
  }

  setStrokes(strokes) {
    this.strokes = strokes.map(s => [...s]);
    this.currentStroke = null;
    this.isDrawing = false;
    this.render();
  }

  getStrokes() {
    return this.strokes.map(s => [...s]);
  }

  undo() {
    this.strokes.pop();
    this.render();
  }

  clear() {
    this.strokes = [];
    this.currentStroke = null;
    this.isDrawing = false;
    this.render();
  }

  setStrokeWidth(w) {
    this.strokeWidth = w;
    this.render();
  }

  setReference(char, font) {
    this.referenceGlyph = char;
    this.referenceFont = font;
    this.render();
  }

  destroy() {
    this.canvas.removeEventListener('pointerdown', this._onStart);
    this.canvas.removeEventListener('pointermove', this._onMove);
    this.canvas.removeEventListener('pointerup', this._onEnd);
    this.canvas.removeEventListener('pointerleave', this._onEnd);
  }
}
