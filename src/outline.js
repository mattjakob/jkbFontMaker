/**
 * Convert a stroke centerline into a closed outline path.
 * @param {Array<{x: number, y: number}>} points - Centerline points (normalized 0-1)
 * @param {number} strokeWidth - Width in normalized units (e.g., 0.04 for 8px on 200px canvas)
 * @param {number} scale - Multiply to get font units (e.g., 1000 for unitsPerEm)
 * @returns {Array<{x: number, y: number}>} Closed outline path in font units
 */
export function strokeToOutline(points, strokeWidth, scale) {
  if (points.length < 2) return [];

  const halfWidth = strokeWidth / 2;
  const perps = computePerpendiculars(points);

  const leftSide = [];
  const rightSide = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const perp = perps[i];

    leftSide.push({
      x: (p.x + perp.x * halfWidth) * scale,
      y: (p.y + perp.y * halfWidth) * scale,
    });
    rightSide.push({
      x: (p.x - perp.x * halfWidth) * scale,
      y: (p.y - perp.y * halfWidth) * scale,
    });
  }

  // Build closed outline: left side forward → end cap → right side backward → start cap
  const outline = [];

  // Left side (forward)
  for (let i = 0; i < leftSide.length; i++) {
    outline.push(leftSide[i]);
  }

  // End cap (semicircle from left to right at the last point)
  const lastPoint = points[points.length - 1];
  const lastPerp = perps[points.length - 1];
  const endCapPoints = makeRoundCap(
    { x: lastPoint.x * scale, y: lastPoint.y * scale },
    lastPerp,
    halfWidth * scale,
    8
  );
  for (const p of endCapPoints) {
    outline.push(p);
  }

  // Right side (backward)
  for (let i = rightSide.length - 1; i >= 0; i--) {
    outline.push(rightSide[i]);
  }

  // Start cap (semicircle from right to left at the first point)
  const firstPoint = points[0];
  const firstPerp = perps[0];
  const startCapPoints = makeRoundCap(
    { x: firstPoint.x * scale, y: firstPoint.y * scale },
    { x: -firstPerp.x, y: -firstPerp.y },
    halfWidth * scale,
    8
  );
  for (const p of startCapPoints) {
    outline.push(p);
  }

  return outline;
}

/**
 * Compute perpendicular vectors for each point on the centerline.
 * At interior points, average the directions of adjacent segments.
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
      dx = dx1 + dx2;
      dy = dy1 + dy2;
    }

    // Rotate 90 degrees to get perpendicular: (dx, dy) -> (-dy, dx)
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
 * @param {number} segments - Number of line segments to approximate the semicircle
 */
function makeRoundCap(center, perpDir, radius, segments) {
  const points = [];
  const startAngle = Math.atan2(perpDir.y, perpDir.x);

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const angle = startAngle + Math.PI * t;
    points.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  }

  return points;
}
