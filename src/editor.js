import { DrawingEngine } from './canvas.js';
import { saveGlyph, getGlyph, GLYPHS } from './glyphs.js';

export class Editor {
  constructor(elements) {
    this.modal = elements.modal;
    this.canvasWrap = elements.canvasWrap;
    this.canvas = elements.canvas;
    this.label = elements.label;
    this.currentChar = null;
    this.currentIndex = -1;
    this.referenceFont = 'Arial';
    this.strokeWidth = 8;

    this.engine = new DrawingEngine(this.canvas);

    // Button listeners
    elements.save.addEventListener('click', () => this.save());
    elements.clear.addEventListener('click', () => this.clear());
    elements.undo.addEventListener('click', () => this.undo());
    elements.cancel.addEventListener('click', () => this.close());
    elements.prev.addEventListener('click', () => this.prev());
    elements.next.addEventListener('click', () => this.next());

    // Close on overlay click (but not on modal body click)
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Keyboard shortcuts (only when modal is open)
    this._onKeyDown = this._onKeyDown.bind(this);
    document.addEventListener('keydown', this._onKeyDown);
  }

  _onKeyDown(e) {
    if (this.modal.hidden) return;

    if (e.key === 'Escape') {
      this.close();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
      e.preventDefault();
      this.undo();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.next();
    }
  }

  open(char, referenceFont, strokeWidth) {
    this.currentChar = char;
    this.currentIndex = GLYPHS.indexOf(char);
    this.referenceFont = referenceFont;
    this.strokeWidth = strokeWidth;
    this.label.textContent = char;
    this.modal.hidden = false;
    document.body.style.overflow = 'hidden';

    // Size canvas for the modal
    this._sizeCanvas();

    this.engine.setStrokeWidth(strokeWidth);
    this.engine.setReference(char, referenceFont);

    // Load existing strokes
    const glyph = getGlyph(char);
    this.engine.setStrokes(glyph.strokes);
  }

  _sizeCanvas() {
    const wrapRect = this.canvasWrap.getBoundingClientRect();
    const size = Math.min(wrapRect.width - 32, 560);
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
  }

  save() {
    const strokes = this.engine.getStrokes();
    saveGlyph(this.currentChar, strokes);
    window.dispatchEvent(new CustomEvent('glyph-updated', { detail: this.currentChar }));
    this.close();
  }

  clear() {
    this.engine.clear();
  }

  undo() {
    this.engine.undo();
  }

  close() {
    this.modal.hidden = true;
    document.body.style.overflow = '';
    this.engine.clear();
    this.currentChar = null;
    this.currentIndex = -1;
  }

  prev() {
    if (this.currentIndex <= 0) return;
    // Auto-save current before navigating
    this._autoSave();
    const newChar = GLYPHS[this.currentIndex - 1];
    this.open(newChar, this.referenceFont, this.strokeWidth);
  }

  next() {
    if (this.currentIndex >= GLYPHS.length - 1) return;
    // Auto-save current before navigating
    this._autoSave();
    const newChar = GLYPHS[this.currentIndex + 1];
    this.open(newChar, this.referenceFont, this.strokeWidth);
  }

  _autoSave() {
    if (this.currentChar) {
      const strokes = this.engine.getStrokes();
      if (strokes.length > 0) {
        saveGlyph(this.currentChar, strokes);
        window.dispatchEvent(new CustomEvent('glyph-updated', { detail: this.currentChar }));
      }
    }
  }

  updateStrokeWidth(w) {
    this.strokeWidth = w;
    if (!this.modal.hidden) {
      this.engine.setStrokeWidth(w);
    }
  }

  updateReferenceFont(font) {
    this.referenceFont = font;
    if (!this.modal.hidden && this.currentChar) {
      this.engine.setReference(this.currentChar, font);
    }
  }
}
