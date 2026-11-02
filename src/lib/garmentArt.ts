// Flat-lay garment illustrations drawn as SVG, used by the landing page demo.
// They stand in for photos, so the live demo works with no uploads and no image files.
import { colorName, hexToRgb, rgbToHex } from "./color";
import type { Category, Formality, Item, Season } from "./types";

function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (v: number) => (amount < 0 ? v * (1 + amount) : v + (255 - v) * amount);
  return rgbToHex(f(r), f(g), f(b));
}
const uri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

export type Style = "tee" | "shirt" | "trousers" | "shorts" | "jacket" | "shoes" | "watch";

export function garmentUri(style: Style, hex: string): string {
  const dark = shade(hex, -0.22);
  const stroke = `stroke="${dark}" stroke-width="2" stroke-linejoin="round"`;
  switch (style) {
    case "tee":
      return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 176 172"><path d="M44 14 72 6q16 18 32 0l28 8 40 38-26 24-16-14v104H46V62L30 76 4 52Z" fill="${hex}" ${stroke}/><path d="M72 6q16 18 32 0" fill="none" ${stroke}/></svg>`);
    case "shirt":
      return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 176 172"><path d="M44 14 72 6l16 16 16-16 28 8 40 38-26 24-16-14v104H46V62L30 76 4 52Z" fill="${hex}" ${stroke}/><path d="M72 6l16 22 16-22M88 28v138" fill="none" ${stroke}/><circle cx="88" cy="60" r="2" fill="${dark}"/><circle cx="88" cy="92" r="2" fill="${dark}"/><circle cx="88" cy="124" r="2" fill="${dark}"/></svg>`);
    case "trousers":
      return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 136 236"><path d="M10 4h116l6 228H78L68 84 58 232H4Z" fill="${hex}" ${stroke}/><path d="M10 16h116M68 16v68" fill="none" ${stroke}/></svg>`);
    case "shorts":
      return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 136 236"><path d="M10 4h116l8 104H78L68 70 58 108H2Z" fill="${hex}" ${stroke}/><path d="M10 16h116" fill="none" ${stroke}/></svg>`);
    case "jacket":
      return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 224 256"><path d="M62 10 88 2q24 22 48 0l26 8 54 70-14 168h-34l-4-120v122H64V128l-4 120H26L8 80Z" fill="${hex}" ${stroke}/><path d="M112 22v230M88 2l24 36 24-36" fill="none" ${stroke}/></svg>`);
    case "shoes":
      return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 92"><g fill="${hex}" ${stroke}><path d="M4 70q0-26 22-28l16-2q8-14 22-2l6 14q10 4 10 18v10H4Z"/><path d="M76 70q0-26 22-28l16-2q8-14 22-2l6 14q10 4 10 18v10H76Z" transform="translate(-4 0)"/></g><g fill="none" stroke="${shade(hex, 0.7)}" stroke-width="5" stroke-linecap="round"><path d="M6 80h60M70 80h66"/></g></svg>`);
    case "watch":
      return uri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><path d="M30 2h20l2 22H28ZM28 56h24l-2 22H30Z" fill="${dark}"/><circle cx="40" cy="40" r="19" fill="${hex}" ${stroke}/><path d="M40 28v12l8 5" fill="none" stroke="${dark}" stroke-width="2.5" stroke-linecap="round"/></svg>`);
  }
}

let n = 0;
function demo(name: string, category: Category, style: Style, hex: string, formality: Formality, season: Season, wearCount = 0): Item {
  n += 1;
  return { _id: `demo${n}`, name, category, colorHex: hex, colorName: colorName(hex), formality, season, wearCount, url: garmentUri(style, hex) };
}

export const DEMO_WARDROBE: Item[] = [
  demo("White tee", "top", "tee", "#f1efe8", "casual", "summer"),
  demo("Black tee", "top", "tee", "#1c1d21", "casual", "all", 3),
  demo("Grey knit", "top", "tee", "#8b8f98", "casual", "winter", 1),
  demo("Navy oxford shirt", "top", "shirt", "#26396a", "smart", "all"),
  demo("White dress shirt", "top", "shirt", "#fbfaf6", "formal", "all", 2),
  demo("Indigo jeans", "bottom", "trousers", "#34528a", "casual", "all", 4),
  demo("Tan chinos", "bottom", "trousers", "#c4a77b", "smart", "all"),
  demo("Charcoal trousers", "bottom", "trousers", "#2c2e35", "formal", "all", 1),
  demo("Linen shorts", "bottom", "shorts", "#dccca4", "casual", "summer"),
  demo("White sneakers", "shoes", "shoes", "#f3f3f0", "casual", "all", 5),
  demo("Brown loafers", "shoes", "shoes", "#6a4428", "smart", "all"),
  demo("Black oxfords", "shoes", "shoes", "#16171a", "formal", "all", 1),
  demo("Olive field jacket", "outerwear", "jacket", "#656b4a", "casual", "spring-fall"),
  demo("Black puffer", "outerwear", "jacket", "#1b1c20", "casual", "winter", 2),
  demo("Navy blazer", "outerwear", "jacket", "#22305a", "formal", "spring-fall"),
  demo("Steel watch", "accessory", "watch", "#b8bcc6", "smart", "all"),
];
