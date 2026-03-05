export function renderGrid(container, glyphs, settings, onGlyphClick) {
  // Clear existing children
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  for (const glyph of glyphs) {
    const card = createGlyphCard(glyph, settings);
    card.addEventListener('click', () => onGlyphClick(glyph.char));
    container.appendChild(card);
  }
}

function createGlyphCard(glyph, settings) {
  const card = document.createElement('div');
  card.className = 'glyph-card' + (glyph.strokes.length ? ' glyph-card--drawn' : '');
  card.dataset.char = glyph.char;

  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  card.appendChild(canvas);

  const label = document.createElement('span');
  label.className = 'glyph-card__label';
  label.textContent = glyph.char;
  card.appendChild(label);

  renderThumbnail(canvas, glyph, settings);

  return card;
}

export function renderThumbnail(canvas, glyph, settings) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Draw reference glyph faded
  if (settings.referenceFont) {
    ctx.save();
    const fontSize = h * 0.7;
    ctx.font = `${fontSize}px "${settings.referenceFont}"`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph.char, w / 2, h / 2);
    ctx.restore();
  }

  // Draw strokes
  if (glyph.strokes.length) {
    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = (settings.strokeWidth || 8) * (w / 200);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of glyph.strokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * w, stroke[0].y * h);
      for (let i = 1; i < stroke.length - 1; i++) {
        const xc = (stroke[i].x + stroke[i + 1].x) / 2 * w;
        const yc = (stroke[i].y + stroke[i + 1].y) / 2 * h;
        ctx.quadraticCurveTo(stroke[i].x * w, stroke[i].y * h, xc, yc);
      }
      const last = stroke[stroke.length - 1];
      ctx.lineTo(last.x * w, last.y * h);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function updateCard(container, char, glyph, settings) {
  const card = container.querySelector(`[data-char="${CSS.escape(char)}"]`);
  if (!card) return;

  // Update drawn state
  if (glyph.strokes.length) {
    card.classList.add('glyph-card--drawn');
  } else {
    card.classList.remove('glyph-card--drawn');
  }

  // Re-render thumbnail
  const canvas = card.querySelector('canvas');
  if (canvas) {
    renderThumbnail(canvas, glyph, settings);
  }
}
