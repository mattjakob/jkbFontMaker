import { DrawingEngine } from './canvas.js';
import { saveGlyph, saveGlyphBearings, getGlyph, GLYPHS } from './glyphs.js';
import { getCharAdvance } from './fonts.js';

const GLYPH_UNITS = 1000;

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
    this.globalKerning = 0;
    this.bearingLeft = 0;
    this.bearingRight = 0;
    this._dragSide = null;

    this.engine = new DrawingEngine(this.canvas);
    this._createBearingHandles();

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

  get isOpen() {
    return this.modal.classList.contains('is-open');
  }

  _onKeyDown(e) {
    if (!this.isOpen) return;

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

    // Remove hidden attr if present (first open)
    if (this.modal.hidden) this.modal.hidden = false;
    document.body.style.overflow = 'hidden';

    // Force reflow so transition plays from initial state
    this.modal.offsetHeight;
    this.modal.classList.add('is-open');

    // Wait for layout before sizing canvas
    requestAnimationFrame(() => {
      this._sizeCanvas();
      this.engine.setStrokeWidth(strokeWidth);
      this.engine.setReference(char, referenceFont);

      const glyph = getGlyph(char);
      this.engine.setStrokes(glyph.strokes);
      this.bearingLeft = glyph.bearingLeft || 0;
      this.bearingRight = glyph.bearingRight || 0;
      this._updateBearingHandles();
    });
  }

  _sizeCanvas() {
    // CSS handles display sizing (width/max-width/aspect-ratio)
    // JS only sets buffer resolution for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.offsetWidth * dpr;
    this.canvas.height = this.canvas.offsetHeight * dpr;
  }

  // --- Bearing handles ---

  _createBearingHandles() {
    this._overlay = document.createElement('div');
    this._overlay.className = 'bearing-overlay';
    this._handleLeft = this._createHandle('left');
    this._handleRight = this._createHandle('right');
    this._overlay.appendChild(this._handleLeft);
    this._overlay.appendChild(this._handleRight);
    this.canvasWrap.style.position = 'relative';
    this.canvasWrap.appendChild(this._overlay);

    this._onHandleDown = this._onHandleDown.bind(this);
    this._onHandleMove = this._onHandleMove.bind(this);
    this._onHandleUp = this._onHandleUp.bind(this);
  }

  _createHandle(side) {
    const handle = document.createElement('div');
    handle.className = `bearing-handle bearing-handle--${side}`;
    handle.dataset.side = side;

    const line = document.createElement('div');
    line.className = 'bearing-handle__line';

    const gripTop = document.createElement('div');
    gripTop.className = 'bearing-handle__grip';
    const gripBottom = document.createElement('div');
    gripBottom.className = 'bearing-handle__grip';

    handle.appendChild(gripTop);
    handle.appendChild(line);
    handle.appendChild(gripBottom);

    gripTop.addEventListener('pointerdown', (e) => this._onHandleDown(e, side));
    gripBottom.addEventListener('pointerdown', (e) => this._onHandleDown(e, side));
    line.addEventListener('pointerdown', (e) => this._onHandleDown(e, side));

    return handle;
  }

  _updateBearingHandles() {
    // Use offset properties (layout coords, unaffected by parent transforms/animations)
    const canvasLeft = this.canvas.offsetLeft;
    const canvasTop = this.canvas.offsetTop;
    const canvasWidth = this.canvas.offsetWidth;
    const canvasHeight = this.canvas.offsetHeight;

    // Center the character's advance width within the em square canvas.
    // Canvas = 1000 units (em square). Default advance = reference font width + globalKerning.
    // Bearings extend outward from the centered default edges.
    const charAdvance = this.currentChar ? getCharAdvance(this.currentChar) : 650;
    const defaultAdvance = charAdvance + this.globalKerning;
    const defaultLeftEdge = (GLYPH_UNITS - defaultAdvance) / 2;
    const defaultRightEdge = defaultLeftEdge + defaultAdvance;

    // bearingLeft moves the left edge further left (more space before glyph)
    // bearingRight moves the right edge further right (more space after glyph)
    const leftEdge = defaultLeftEdge - this.bearingLeft;
    const rightEdge = defaultRightEdge + this.bearingRight;

    const leftX = canvasLeft + (leftEdge / GLYPH_UNITS) * canvasWidth;
    const rightX = canvasLeft + (rightEdge / GLYPH_UNITS) * canvasWidth;

    this._handleLeft.style.left = leftX + 'px';
    this._handleRight.style.left = rightX + 'px';

    this._handleLeft.style.top = canvasTop + 'px';
    this._handleLeft.style.height = canvasHeight + 'px';
    this._handleRight.style.top = canvasTop + 'px';
    this._handleRight.style.height = canvasHeight + 'px';
  }

  _onHandleDown(e, side) {
    e.preventDefault();
    e.stopPropagation();
    this._dragSide = side;
    this._dragStartX = e.clientX;
    this._dragStartValue = side === 'left' ? this.bearingLeft : this.bearingRight;
    document.addEventListener('pointermove', this._onHandleMove);
    document.addEventListener('pointerup', this._onHandleUp);
    document.body.style.cursor = 'ew-resize';
    (side === 'left' ? this._handleLeft : this._handleRight).classList.add('bearing-handle--active');
  }

  _onHandleMove(e) {
    if (!this._dragSide) return;
    const dx = e.clientX - this._dragStartX;
    // Use getBoundingClientRect for drag since clientX is in viewport coords
    const canvasWidth = this.canvas.getBoundingClientRect().width;
    const unitsPerPixel = GLYPH_UNITS / canvasWidth;
    const delta = dx * unitsPerPixel;

    if (this._dragSide === 'left') {
      // Dragging left handle LEFT = positive bearingLeft (more space before glyph)
      this.bearingLeft = Math.round(Math.max(-200, Math.min(300, this._dragStartValue - delta)));
    } else {
      // Dragging right handle RIGHT = positive bearingRight (more space after glyph)
      this.bearingRight = Math.round(Math.max(-200, Math.min(300, this._dragStartValue + delta)));
    }
    this._updateBearingHandles();
  }

  _onHandleUp() {
    if (this._dragSide) {
      const handle = this._dragSide === 'left' ? this._handleLeft : this._handleRight;
      handle.classList.remove('bearing-handle--active');
    }
    this._dragSide = null;
    document.removeEventListener('pointermove', this._onHandleMove);
    document.removeEventListener('pointerup', this._onHandleUp);
    document.body.style.cursor = '';

    if (this.currentChar) {
      saveGlyphBearings(this.currentChar, this.bearingLeft, this.bearingRight);
      window.dispatchEvent(new CustomEvent('glyph-updated', { detail: this.currentChar }));
    }
  }

  // --- Actions ---

  save() {
    const strokes = this.engine.getStrokes();
    saveGlyph(this.currentChar, strokes);
    saveGlyphBearings(this.currentChar, this.bearingLeft, this.bearingRight);
    window.dispatchEvent(new CustomEvent('glyph-updated', { detail: this.currentChar }));
    this.close();
  }

  clear() {
    this.engine.clear();
    this.bearingLeft = 0;
    this.bearingRight = 0;
    this._updateBearingHandles();
  }

  undo() {
    this.engine.undo();
  }

  close() {
    this.modal.classList.remove('is-open');
    document.body.style.overflow = '';
    this.engine.clear();
    this.currentChar = null;
    this.currentIndex = -1;
    this.bearingLeft = 0;
    this.bearingRight = 0;
  }

  prev() {
    if (this.currentIndex <= 0) return;
    this._autoSave();
    const newChar = GLYPHS[this.currentIndex - 1];
    this.open(newChar, this.referenceFont, this.strokeWidth);
  }

  next() {
    if (this.currentIndex >= GLYPHS.length - 1) return;
    this._autoSave();
    const newChar = GLYPHS[this.currentIndex + 1];
    this.open(newChar, this.referenceFont, this.strokeWidth);
  }

  _autoSave() {
    if (this.currentChar) {
      const strokes = this.engine.getStrokes();
      if (strokes.length > 0) {
        saveGlyph(this.currentChar, strokes);
      }
      saveGlyphBearings(this.currentChar, this.bearingLeft, this.bearingRight);
      window.dispatchEvent(new CustomEvent('glyph-updated', { detail: this.currentChar }));
    }
  }

  updateStrokeWidth(w) {
    this.strokeWidth = w;
    if (this.isOpen) {
      this.engine.setStrokeWidth(w);
    }
  }

  updateReferenceFont(font) {
    this.referenceFont = font;
    if (this.isOpen && this.currentChar) {
      this.engine.setReference(this.currentChar, font);
    }
  }

  updateGlobalKerning(kerning) {
    this.globalKerning = kerning;
    if (this.isOpen) {
      this._updateBearingHandles();
    }
  }

}
