export type HSL = [number, number, number]; // h 0-360, s 0-1, l 0-1

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const to = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function hexToHsl(hex: string): HSL {
  const [r8, g8, b8] = hexToRgb(hex);
  const r = r8 / 255;
  const g = g8 / 255;
  const b = b8 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  return [h, s, l];
}

export function isNeutral([, s, l]: HSL): boolean {
  return s < 0.18 || l < 0.13 || l > 0.9;
}

const HUES: [number, string][] = [
  [15, "red"],
  [45, "orange"],
  [70, "yellow"],
  [160, "green"],
  [200, "teal"],
  [255, "blue"],
  [290, "purple"],
  [335, "pink"],
  [360, "red"],
];

/** A friendly colour name such as "navy", "light grey" or "dark green". */
export function colorName(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  if (l < 0.13) return "black";
  if (l > 0.92) return "white";
  if (s < 0.12) return l < 0.35 ? "charcoal" : l > 0.75 ? "light grey" : "grey";
  let base = HUES.find(([max]) => h < max)?.[1] ?? "red";
  if (base === "orange" && l < 0.4) base = "brown";
  if (base === "blue" && l < 0.3) return "navy";
  if (base === "red" && s < 0.45 && l < 0.4) return "burgundy";
  if (l < 0.28) return `dark ${base}`;
  if (l > 0.72) return `light ${base}`;
  return base;
}

/** How well two colours go together: roughly -1.5 (clash) to 1.5 (great). */
export function harmonyScore(aHex: string, bHex: string): number {
  const a = hexToHsl(aHex);
  const b = hexToHsl(bHex);
  const aN = isNeutral(a);
  const bN = isNeutral(b);
  if (aN && bN) return 1;
  if (aN || bN) return 1;
  const raw = Math.abs(a[0] - b[0]);
  const d = Math.min(raw, 360 - raw);
  if (d < 25) return 1.5; // same family
  if (d < 60) return 0.5; // neighbours
  if (d < 100) return -1.5; // awkward gap
  if (d < 150) return -0.5;
  return 1; // opposites
}

/**
 * Finds the main colour in raw RGBA pixel data (as from canvas getImageData).
 * Transparent pixels (a removed background) are ignored.
 */
export function dominantColor(rgba: ArrayLike<number>): string {
  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue;
    const r = rgba[i];
    const g = rgba[i + 1];
    const b = rgba[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bucket.n += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }
  let best: { n: number; r: number; g: number; b: number } | null = null;
  for (const bucket of buckets.values()) if (!best || bucket.n > best.n) best = bucket;
  if (!best) return "#808080";
  return rgbToHex(best.r / best.n, best.g / best.n, best.b / best.n);
}
