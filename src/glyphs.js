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
  return { char, strokes: [], width: DEFAULT_WIDTH, bearingLeft: 0, bearingRight: 0 };
}

function hydrateGlyph(char, saved) {
  return {
    char,
    strokes: saved.strokes || [],
    width: saved.width || DEFAULT_WIDTH,
    bearingLeft: saved.bearingLeft || 0,
    bearingRight: saved.bearingRight || 0,
  };
}

function getGlyphSet() {
  const store = loadGlyphStore();
  return GLYPHS.map((char) => {
    const saved = store[char];
    if (saved) return hydrateGlyph(char, saved);
    return makeDefaultGlyph(char);
  });
}

function getGlyph(char) {
  const store = loadGlyphStore();
  const saved = store[char];
  if (saved) return hydrateGlyph(char, saved);
  return makeDefaultGlyph(char);
}

function saveGlyph(char, strokes) {
  const store = loadGlyphStore();
  const existing = store[char] || {};
  store[char] = {
    strokes,
    width: existing.width || DEFAULT_WIDTH,
    bearingLeft: existing.bearingLeft || 0,
    bearingRight: existing.bearingRight || 0,
  };
  saveGlyphStore(store);
}

function saveGlyphBearings(char, bearingLeft, bearingRight) {
  const store = loadGlyphStore();
  const existing = store[char] || { strokes: [], width: DEFAULT_WIDTH };
  store[char] = { ...existing, bearingLeft, bearingRight };
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
      kerning: saved.kerning ?? 0,
    };
  } catch {
    return { fontName: 'My Font', referenceFont: 'Arial', strokeWidth: 8, kerning: 0 };
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

function clearAllGlyphs() {
  saveGlyphStore({});
}

export {
  GLYPHS,
  getGlyphSet,
  getGlyph,
  saveGlyph,
  saveGlyphBearings,
  clearGlyph,
  clearAllGlyphs,
  isGlyphDrawn,
  getAllGlyphs,
  getDrawnCount,
  getSettings,
  saveSettings,
  exportProject,
  importProject,
};
