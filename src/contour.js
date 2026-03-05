export const TRACE_SIZE = 500;

export function glyphToContours(strokes, strokeWidth) {
  if (!strokes || strokes.length === 0) return [];

  const { grid, width, height } = renderToGrid(strokes, strokeWidth);
  const rawContours = extractContours(grid, width, height);

  // Simplify, then reverse for correct TrueType winding after Y-flip
  return rawContours
    .map(c => simplify(c, 1.5))
    .filter(c => c.length >= 3)
    .map(c => c.reverse());
}

function renderToGrid(strokes, strokeWidth) {
  const size = TRACE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = strokeWidth * (size / 200);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const stroke of strokes) {
    if (stroke.length < 2) continue;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x * size, stroke[0].y * size);
    for (let i = 1; i < stroke.length - 1; i++) {
      const xc = (stroke[i].x + stroke[i + 1].x) / 2 * size;
      const yc = (stroke[i].y + stroke[i + 1].y) / 2 * size;
      ctx.quadraticCurveTo(stroke[i].x * size, stroke[i].y * size, xc, yc);
    }
    const last = stroke[stroke.length - 1];
    ctx.lineTo(last.x * size, last.y * size);
    ctx.stroke();
  }

  const imageData = ctx.getImageData(0, 0, size, size);
  const grid = new Uint8Array(size * size);
  for (let i = 0; i < size * size; i++) {
    grid[i] = imageData.data[i * 4 + 3] > 128 ? 1 : 0;
  }

  return { grid, width: size, height: size };
}

// Marching squares edge table
// Edges: 0=top, 1=right, 2=bottom, 3=left
// For each case: entry edge → exit edge
const EDGES = [];
EDGES[0] = null;
EDGES[1] = { 3: 2, 2: 3 };
EDGES[2] = { 2: 1, 1: 2 };
EDGES[3] = { 3: 1, 1: 3 };
EDGES[4] = { 0: 1, 1: 0 };
EDGES[5] = { 3: 0, 0: 3, 2: 1, 1: 2 };
EDGES[6] = { 0: 2, 2: 0 };
EDGES[7] = { 3: 0, 0: 3 };
EDGES[8] = { 0: 3, 3: 0 };
EDGES[9] = { 0: 2, 2: 0 };
EDGES[10] = { 0: 1, 1: 0, 3: 2, 2: 3 };
EDGES[11] = { 0: 1, 1: 0 };
EDGES[12] = { 3: 1, 1: 3 };
EDGES[13] = { 1: 2, 2: 1 };
EDGES[14] = { 2: 3, 3: 2 };
EDGES[15] = null;

const EDGE_MID = [
  [0.5, 0],
  [1, 0.5],
  [0.5, 1],
  [0, 0.5],
];

const NEIGHBOR = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

const OPPOSITE = [2, 3, 0, 1];

function getCase(grid, x, y, w, h) {
  const g = (px, py) =>
    px >= 0 && py >= 0 && px < w && py < h ? grid[py * w + px] : 0;
  return (g(x, y) << 3) | (g(x + 1, y) << 2) | (g(x + 1, y + 1) << 1) | g(x, y + 1);
}

function extractContours(grid, w, h) {
  const contours = [];
  const visited = new Set();

  for (let y = -1; y < h; y++) {
    for (let x = -1; x < w; x++) {
      const c = getCase(grid, x, y, w, h);
      if (!EDGES[c]) continue;

      for (const entryStr of Object.keys(EDGES[c])) {
        const entry = parseInt(entryStr);
        const key = `${x},${y},${entry}`;
        if (visited.has(key)) continue;

        const contour = trace(grid, w, h, x, y, entry, visited);
        if (contour.length >= 3) contours.push(contour);
      }
    }
  }

  return contours;
}

function trace(grid, w, h, sx, sy, sEntry, visited) {
  const pts = [];
  let cx = sx, cy = sy, entry = sEntry;
  let limit = w * h;

  do {
    const c = getCase(grid, cx, cy, w, h);
    const table = EDGES[c];
    if (!table || !(entry in table)) break;

    const exit = table[entry];
    visited.add(`${cx},${cy},${entry}`);
    visited.add(`${cx},${cy},${exit}`);

    const [mx, my] = EDGE_MID[exit];
    pts.push({ x: cx + mx, y: cy + my });

    const [nx, ny] = NEIGHBOR[exit];
    cx += nx;
    cy += ny;
    entry = OPPOSITE[exit];

    if (--limit <= 0) break;
  } while (cx !== sx || cy !== sy || entry !== sEntry);

  return pts;
}

function simplify(pts, tol) {
  if (pts.length <= 2) return pts;

  let maxD = 0, maxI = 0;
  const a = pts[0], b = pts[pts.length - 1];

  for (let i = 1; i < pts.length - 1; i++) {
    const d = pDist(pts[i], a, b);
    if (d > maxD) { maxD = d; maxI = i; }
  }

  if (maxD > tol) {
    const l = simplify(pts.slice(0, maxI + 1), tol);
    const r = simplify(pts.slice(maxI), tol);
    return l.slice(0, -1).concat(r);
  }
  return [a, b];
}

function pDist(p, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const sq = dx * dx + dy * dy;
  if (sq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / sq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}
