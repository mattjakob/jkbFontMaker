import { getSystemFonts } from './fonts.js';
import { getGlyphSet, getGlyph, getSettings, saveSettings, getDrawnCount, GLYPHS, importProject } from './glyphs.js';
import { renderGrid, updateCard, refreshAllThumbnails } from './grid.js';
import { Editor } from './editor.js';
import { Preview } from './preview.js';
import { exportFont } from './font-export.js';

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
  // Stroke width
  const strokeWidthInput = document.getElementById('strokeWidth');
  const strokeWidthValue = document.getElementById('strokeWidthValue');
  strokeWidthInput.value = settings.strokeWidth;
  strokeWidthValue.textContent = settings.strokeWidth + 'px';

  // Initialize editor
  const editor = new Editor({
    modal: document.getElementById('editorModal'),
    canvasWrap: document.getElementById('editorCanvasWrap'),
    canvas: document.getElementById('editorCanvas'),
    label: document.getElementById('editorLabel'),
    save: document.getElementById('editorSave'),
    clear: document.getElementById('editorClear'),
    undo: document.getElementById('editorUndo'),
    cancel: document.getElementById('editorCancel'),
    prev: document.getElementById('editorPrev'),
    next: document.getElementById('editorNext'),
  });

  // Initialize preview
  const preview = new Preview(
    document.getElementById('previewCanvas'),
    document.getElementById('previewInput')
  );
  preview.setReferenceFont(settings.referenceFont);

  // Render glyph grid
  const glyphGrid = document.getElementById('glyphGrid');
  const glyphs = getGlyphSet();

  refFontSelect.addEventListener('change', () => {
    saveSettings({ referenceFont: refFontSelect.value });
    editor.updateReferenceFont(refFontSelect.value);
    preview.setReferenceFont(refFontSelect.value);
    refreshAllThumbnails(glyphGrid, getGlyphSet(), getSettings());
  });

  strokeWidthInput.addEventListener('input', () => {
    strokeWidthValue.textContent = strokeWidthInput.value + 'px';
    saveSettings({ strokeWidth: parseInt(strokeWidthInput.value) });
    editor.updateStrokeWidth(parseInt(strokeWidthInput.value));
    refreshAllThumbnails(glyphGrid, getGlyphSet(), getSettings());
  });

  // Progress counter
  updateProgress();
  renderGrid(glyphGrid, glyphs, settings, (char) => {
    editor.open(char, refFontSelect.value, parseInt(strokeWidthInput.value));
  });

  // Export button
  document.getElementById('exportBtn').addEventListener('click', () => {
    const fontName = document.getElementById('fontName').value || 'MyFont';
    const sw = parseInt(document.getElementById('strokeWidth').value);
    exportFont(fontName, sw);
  });

  // Import button
  const importFileInput = document.getElementById('importFile');
  document.getElementById('importBtn').addEventListener('click', () => {
    importFileInput.click();
  });
  importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (importProject(data)) {
          // Restore all UI from imported data
          const s = getSettings();
          fontNameInput.value = s.fontName;
          strokeWidthInput.value = s.strokeWidth;
          strokeWidthValue.textContent = s.strokeWidth + 'px';
          // Update reference font select if the font is in the list
          for (const opt of refFontSelect.options) {
            if (opt.value === s.referenceFont) {
              opt.selected = true;
              break;
            }
          }
          editor.updateReferenceFont(s.referenceFont);
          editor.updateStrokeWidth(s.strokeWidth);
          preview.setReferenceFont(s.referenceFont);
          renderGrid(glyphGrid, getGlyphSet(), s, (char) => {
            editor.open(char, refFontSelect.value, parseInt(strokeWidthInput.value));
          });
          updateProgress();
        }
      } catch {
        // Invalid JSON
      }
      importFileInput.value = '';
    };
    reader.readAsText(file);
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
