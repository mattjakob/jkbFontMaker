/**
 * Convert a stroke centerline into a closed outline path.
 * @param {Array<{x: number, y: number}>} points - Centerline points (normalized 0-1)
 * @param {number} strokeWidth - Width in normalized units (e.g., 0.04 for 8px on 200px canvas)
 * @param {number} scale - Multiply to get font units (e.g., 1000 for unitsPerEm)
 * @returns {Array<{x: number, y: number}>} Closed outline path in font units
 */
export function strokeToOutline(points, strokeWidth, scale) {
  if (points.length < 2) return [];

  const simplified = simplifyPoints(points, 0.005);
  if (simplified.length < 2) return [];

  const halfWidth = strokeWidth / 2;
  const perps = computePerpendiculars(simplified);

  const leftSide = [];
  const rightSide = [];

  for (let i = 0; i < simplified.length; i++) {
    const p = simplified[i];
    const perp = perps[i];

    let hw = halfWidth;
    if (i > 0 && i < simplified.length - 1) {
      const dx1 = simplified[i].x - simplified[i - 1].x;
      const dy1 = simplified[i].y - simplified[i - 1].y;
      const dx2 = simplified[i + 1].x - simplified[i].x;
      const dy2 = simplified[i + 1].y - simplified[i].y;
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
      const dot = (dx1 / len1) * (dx2 / len2) + (dy1 / len1) * (dy2 / len2);
      // dot = cos(angle between segments). dot = 1 means straight, dot = -1 means reversal
      // For sharp turns (dot < 0), reduce offset to prevent self-intersection
      if (dot < 0.5) {
        hw = halfWidth * Math.max(0.4, (dot + 1) / 2);
      }
    }

    leftSide.push({
      x: (p.x + perp.x * hw) * scale,
      y: (p.y + perp.y * hw) * scale,
    });
    rightSide.push({
      x: (p.x - perp.x * hw) * scale,
      y: (p.y - perp.y * hw) * scale,
    });
  }

  const outline = [];

  // Left side forward
  for (const p of leftSide) outline.push(p);

  // End cap: semicircle from left side to right side
  const lastIdx = simplified.length - 1;
  const endCap = makeRoundCap(
    { x: simplified[lastIdx].x * scale, y: simplified[lastIdx].y * scale },
    perps[lastIdx],
    halfWidth * scale,
    12,
    1 // counterclockwise sweep
  );
  for (const p of endCap) outline.push(p);

  // Right side backward
  for (let i = rightSide.length - 1; i >= 0; i--) outline.push(rightSide[i]);

  // Start cap: semicircle from right side to left side (opposite sweep direction)
  const startCap = makeRoundCap(
    { x: simplified[0].x * scale, y: simplified[0].y * scale },
    { x: -perps[0].x, y: -perps[0].y },
    halfWidth * scale,
    12,
    -1 // clockwise sweep (opposite direction to go around the outside)
  );
  for (const p of startCap) outline.push(p);

  return outline;
}

/**
 * Compute perpendicular vectors for each point on the centerline.
 */
function computePerpendiculars(points) {
  const perps = [];

  for (let i = 0; i < points.length; i++) {
    let dx, dy;

    if (i === 0) {
      dx = points[1].x - points[0].x;
      dy = points[1].y - points[0].y;
    } else if (i === points.length - 1) {
      dx = points[i].x - points[i - 1].x;
      dy = points[i].y - points[i - 1].y;
    } else {
      const dx1 = points[i].x - points[i - 1].x;
      const dy1 = points[i].y - points[i - 1].y;
      const dx2 = points[i + 1].x - points[i].x;
      const dy2 = points[i + 1].y - points[i].y;
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
      // Normalize before averaging to prevent bias from segment length
      dx = dx1 / len1 + dx2 / len2;
      dy = dy1 / len1 + dy2 / len2;
    }

    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    perps.push({
      x: -dy / len,
      y: dx / len,
    });
  }

  return perps;
}

/**
 * Generate semicircle points for a round cap.
 * @param {Object} center - Center point {x, y} in final units
 * @param {Object} perpDir - Perpendicular direction (normalized) at this endpoint
 * @param {number} radius - Cap radius in final units
 * @param {number} segments - Number of segments for the semicircle
 * @param {number} direction - 1 for CCW sweep, -1 for CW sweep
 */
function makeRoundCap(center, perpDir, radius, segments, direction) {
  const points = [];
  const startAngle = Math.atan2(perpDir.y, perpDir.x);

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const angle = startAngle + direction * Math.PI * t;
    points.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  }

  return points;
}

/**
 * Douglas-Peucker line simplification.
 * Reduces point count while preserving shape.
 */
function simplifyPoints(points, tolerance) {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyPoints(points.slice(0, maxIdx + 1), tolerance);
    const right = simplifyPoints(points.slice(maxIdx), tolerance);
    return left.slice(0, -1).concat(right);
  }

  return [first, last];
}

function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const ex = point.x - lineStart.x;
    const ey = point.y - lineStart.y;
    return Math.sqrt(ex * ex + ey * ey);
  }

  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq));
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;
  const ex = point.x - projX;
  const ey = point.y - projY;
  return Math.sqrt(ex * ex + ey * ey);
}
