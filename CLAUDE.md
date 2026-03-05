# CLAUDE.md

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
| Frontend | Vanilla JS, HTML Canvas 2D, Vite |
| Font Export | opentype.js 1.3.4 |
| UI Font | Fira Code (Google Fonts) |
| Storage | localStorage |

## Architecture
Single-page app for creating handwritten fonts. Users draw glyphs on canvas, strokes are stored as normalized point arrays. Font export expands stroke centerlines into vector outlines (perpendicular offset + round caps) and compiles to OTF via opentype.js.

## Project Structure
- `src/main.js` — App entry, event wiring, initialization
- `src/glyphs.js` — Glyph data model, localStorage persistence
- `src/canvas.js` — Canvas 2D drawing engine (DrawingEngine class)
- `src/editor.js` — Edit modal logic (Editor class)
- `src/grid.js` — Glyph grid rendering with thumbnails
- `src/preview.js` — Text preview renderer (Preview class)
- `src/outline.js` — Stroke-to-outline vector conversion
- `src/font-export.js` — opentype.js font compilation + download
- `src/fonts.js` — System font detection
- `src/style.css` — All styles (CSS variables, dark theme)

## Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to dist/ |
| `npm run preview` | Preview production build |

## Commit Format
<tag>: Short summary (<=72 chars)
Tags: feat, fix, refactor, docs, style, test, chore
