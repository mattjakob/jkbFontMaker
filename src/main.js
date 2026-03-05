import { getSystemFonts } from './fonts.js';
import { getGlyphSet, getGlyph, getSettings, saveSettings, getDrawnCount, GLYPHS } from './glyphs.js';
import { renderGrid, updateCard } from './grid.js';

async function init() {
  // Load settings
  const settings = getSettings();

  // Restore font name
  const fontNameInput = document.getElementById('fontName');
  fontNameInput.value = settings.fontName;
  fontNameInput.addEventListener('input', () => {
    saveSettings({ fontName: fontNameInput.value });
  });

  // Load system fonts
  const fonts = await getSystemFonts();
  const refFontSelect = document.getElementById('refFont');
  for (const font of fonts) {
    const option = document.createElement('option');
    option.value = font;
    option.textContent = font;
    if (font === settings.referenceFont) option.selected = true;
    refFontSelect.appendChild(option);
  }
  refFontSelect.addEventListener('change', () => {
    saveSettings({ referenceFont: refFontSelect.value });
  });

  // Stroke width
  const strokeWidthInput = document.getElementById('strokeWidth');
  const strokeWidthValue = document.getElementById('strokeWidthValue');
  strokeWidthInput.value = settings.strokeWidth;
  strokeWidthValue.textContent = settings.strokeWidth + 'px';
  strokeWidthInput.addEventListener('input', () => {
    strokeWidthValue.textContent = strokeWidthInput.value + 'px';
    saveSettings({ strokeWidth: parseInt(strokeWidthInput.value) });
  });

  // Progress counter
  updateProgress();

  // Render glyph grid
  const glyphGrid = document.getElementById('glyphGrid');
  const glyphs = getGlyphSet();
  renderGrid(glyphGrid, glyphs, settings, (char) => {
    // Editor will be wired in Task 7
    console.log('Edit glyph:', char);
  });

  // Listen for glyph updates to refresh cards
  window.addEventListener('glyph-updated', (e) => {
    const char = e.detail;
    const glyph = getGlyph(char);
    const currentSettings = getSettings();
    updateCard(glyphGrid, char, glyph, currentSettings);
    updateProgress();
  });
}

function updateProgress() {
  const count = getDrawnCount();
  document.getElementById('progressCount').textContent = count + ' / ' + GLYPHS.length;
}

// Make updateProgress available for other modules
window.updateProgress = updateProgress;

init();
