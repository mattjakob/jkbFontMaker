# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Rules
**Execute ONLY what is explicitly requested. No more, no less.**
- Read existing code before modifying; follow existing patterns exactly
- Keep files under 600 lines
- No unrequested features, documentation, emojis in code
- Monochrome UI only: black/white/gray + semantic colors
- Edit existing files in place; preserve exact indentation

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JS, HTML Canvas 2D, Vite 7 |
| Font Export | opentype.js 1.3.4 |
| UI Font | Fira Code (Google Fonts CDN) |
| Storage | localStorage |

## Architecture
Single-page app for creating handwritten fonts. Users draw glyphs on canvas using pointer events. Strokes are stored as normalized (0-1) coordinate arrays in localStorage. Font export rasterizes strokes to a 1000x1000 offscreen canvas, traces contours via marching squares, applies Chaikin smoothing, then compiles to OTF via opentype.js.

Key data flow: drawing (canvas.js) -> normalized strokes -> localStorage (glyphs.js) -> bitmap rasterization -> marching squares contour extraction (contour.js) -> Douglas-Peucker simplification -> Chaikin smoothing -> winding fix -> opentype.js path -> OTF file (font-export.js).

Settings (font name, reference font, stroke width, kerning) are persisted separately in localStorage and exported/imported alongside glyphs as JSON.

## Project Structure
- `index.html` — App shell, two-row top bar, glyph grid, preview section, editor modal
- `src/main.js` — App entry, event wiring, initialization
- `src/glyphs.js` — Glyph data model, settings, localStorage persistence, import/export
- `src/canvas.js` — DrawingEngine class (pointer events, quadratic curve rendering)
- `src/editor.js` — Editor modal (open/save/clear/undo/prev/next, keyboard shortcuts)
- `src/grid.js` — Glyph grid rendering with thumbnails, progress badge positioning
- `src/preview.js` — Live text preview with kerning-aware spacing
- `src/contour.js` — Marching squares bitmap-to-vector tracing, corner-aware Chaikin smoothing
- `src/font-export.js` — opentype.js OTF compilation + JSON project export
- `src/fonts.js` — System font detection (queryLocalFonts API with fallback list)
- `src/outline.js` — UNUSED legacy perpendicular offset approach (superseded by contour.js)
- `src/style.css` — All styles (CSS variables, dark theme, responsive)

## Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to dist/ |
| `npm run preview` | Preview production build |

## Commit Format
<tag>: Short summary (<=72 chars)
Tags: feat, fix, refactor, docs, style, test, chore
