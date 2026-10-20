/** Geometry helpers for the letter wheel. */

export function computeD(): number {
  return Math.round(
    Math.min(
      Math.min(typeof window !== "undefined" ? window.innerWidth : 480, 480) * 0.7,
      300,
      typeof window !== "undefined" ? window.innerHeight * 0.36 : 200,
    ),
  );
}

export function ringRadius(letterCount: number, D: number): number {
  return (D / 2) * (letterCount <= 3 ? 0.6 : 0.68);
}

export interface Point {
  x: number;
  y: number;
}

export function letterCenter(index: number, letterCount: number, ring: number, D: number): Point {
  const a = -Math.PI / 2 + (index * 2 * Math.PI) / letterCount;
  return { x: D / 2 + ring * Math.cos(a), y: D / 2 + ring * Math.sin(a) };
}

export function hitRadius(letterCount: number, D: number): number {
  const ring = ringRadius(letterCount, D);
  return Math.min(D * 0.14, 0.9 * ring * Math.sin(Math.PI / letterCount));
}

export function hitTest(
  x: number,
  y: number,
  letterCount: number,
  D: number,
): number {
  const ring = ringRadius(letterCount, D);
  const hit = hitRadius(letterCount, D);
  let best = -1;
  let bestDist = hit;
  for (let i = 0; i < letterCount; i++) {
    const c = letterCenter(i, letterCount, ring, D);
    const dx = x - c.x;
    const dy = y - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return best;
}
