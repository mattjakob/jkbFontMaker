const STORAGE_KEY = 'jkbFontMaker_glyphs';
const SETTINGS_KEY = 'jkbFontMaker_settings';
const DEFAULT_WIDTH = 650;

const GLYPHS = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  ...'abcdefghijklmnopqrstuvwxyz'.split(''),
  ...'0123456789'.split(''),
  ...'.,!?\'"\\-():;'.split(''),
];

function loadGlyphStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveGlyphStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function makeDefaultGlyph(char) {
  return { char, strokes: [], width: DEFAULT_WIDTH };
}

function getGlyphSet() {
  const store = loadGlyphStore();
  return GLYPHS.map((char) => {
    const saved = store[char];
    if (saved) {
      return { char, strokes: saved.strokes || [], width: saved.width || DEFAULT_WIDTH };
    }
    return makeDefaultGlyph(char);
  });
}

function getGlyph(char) {
  const store = loadGlyphStore();
  const saved = store[char];
  if (saved) {
    return { char, strokes: saved.strokes || [], width: saved.width || DEFAULT_WIDTH };
  }
  return makeDefaultGlyph(char);
}

function saveGlyph(char, strokes) {
  const store = loadGlyphStore();
  store[char] = { strokes, width: store[char]?.width || DEFAULT_WIDTH };
  saveGlyphStore(store);
}

function clearGlyph(char) {
  const store = loadGlyphStore();
  delete store[char];
  saveGlyphStore(store);
}

function isGlyphDrawn(char) {
  const store = loadGlyphStore();
  const saved = store[char];
  return !!(saved && saved.strokes && saved.strokes.length > 0);
}

function getAllGlyphs() {
  return getGlyphSet();
}

function getDrawnCount() {
  const store = loadGlyphStore();
  return Object.values(store).filter((g) => g.strokes && g.strokes.length > 0).length;
}

function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const saved = raw ? JSON.parse(raw) : {};
    return {
      fontName: saved.fontName || 'My Font',
      referenceFont: saved.referenceFont || 'Arial',
      strokeWidth: saved.strokeWidth || 8,
    };
  } catch {
    return { fontName: 'My Font', referenceFont: 'Arial', strokeWidth: 8 };
  }
}

function saveSettings(settings) {
  const current = getSettings();
  const merged = { ...current, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
}

function exportProject() {
  return {
    version: 1,
    settings: getSettings(),
    glyphs: loadGlyphStore(),
  };
}

function importProject(data) {
  if (!data || !data.glyphs) return false;
  if (data.settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
  }
  saveGlyphStore(data.glyphs);
  return true;
}

export {
  GLYPHS,
  getGlyphSet,
  getGlyph,
  saveGlyph,
  clearGlyph,
  isGlyphDrawn,
  getAllGlyphs,
  getDrawnCount,
  getSettings,
  saveSettings,
  exportProject,
  importProject,
};
