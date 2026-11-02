import { harmonyScore } from "./color";
import type { Formality, Item, Season } from "./types";

export type Occasion = "casual" | "work" | "date" | "formal";
export const OCCASIONS: { id: Occasion; label: string; formality: Formality }[] = [
  { id: "casual", label: "Everyday", formality: "casual" },
  { id: "work", label: "Work", formality: "smart" },
  { id: "date", label: "Date night", formality: "smart" },
  { id: "formal", label: "Formal event", formality: "formal" },
];

export type Suggestion = {
  items: Item[];
  score: number;
  reasons: string[];
};

export type StylistResult = { suggestions: Suggestion[]; missing: string[] };

const FORMALITY_ORDER: Formality[] = ["casual", "smart", "formal"];

function neededSeason(tempC: number): Season {
  if (tempC >= 24) return "summer";
  if (tempC <= 12) return "winter";
  return "spring-fall";
}

function seasonScore(item: Season, needed: Season): number {
  if (item === "all") return 1;
  if (item === needed) return 2;
  if (item === "spring-fall" || needed === "spring-fall") return 0.5;
  return -4; // summer piece in winter or the other way round
}

function itemScore(item: Item, targetFormality: Formality, tempC: number): number {
  const dist = Math.abs(
    FORMALITY_ORDER.indexOf(item.formality) - FORMALITY_ORDER.indexOf(targetFormality),
  );
  return (
    3 - 1.5 * dist + seasonScore(item.season, neededSeason(tempC)) + 0.5 / (1 + item.wearCount)
  );
}

function topK(items: Item[], k: number, score: (i: Item) => number): Item[] {
  return [...items].sort((a, b) => score(b) - score(a)).slice(0, k);
}

function pairHarmony(pieces: Item[]): number {
  let total = 0;
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      total += harmonyScore(pieces[i].colorHex, pieces[j].colorHex);
    }
  }
  return total;
}

export function generateSuggestions(
  wardrobe: Item[],
  options: { occasion: Occasion; tempC: number; count?: number },
): StylistResult {
  const { occasion, tempC, count = 3 } = options;
  const target = OCCASIONS.find((o) => o.id === occasion)?.formality ?? "casual";
  const score = (i: Item) => itemScore(i, target, tempC);
  const by = (c: Item["category"]) => wardrobe.filter((i) => i.category === c);

  const tops = topK(by("top"), 4, score);
  const bottoms = topK(by("bottom"), 4, score);
  const dresses = topK(by("dress"), 4, score);
  const shoes = topK(by("shoes"), 4, score);
  const outerwear = topK(by("outerwear"), 4, score);
  const accessories = by("accessory");

  const missing: string[] = [];
  const canDress = dresses.length > 0;
  const canSeparates = tops.length > 0 && bottoms.length > 0;
  if (!canDress && !canSeparates) missing.push("a top and a bottom (or a dress)");
  if (shoes.length === 0) missing.push("shoes");
  const wantsOuter = tempC <= 16;
  if (wantsOuter && outerwear.length === 0) missing.push("a jacket or coat for this temperature");
  if (!canDress && !canSeparates) return { suggestions: [], missing };

  // Every possible base: a dress, or a top + a bottom.
  const bases: Item[][] = [
    ...dresses.map((d) => [d]),
    ...tops.flatMap((t) => bottoms.map((b) => [t, b])),
  ];
  const shoeOptions: (Item | null)[] = shoes.length ? shoes : [null];
  const outerOptions: (Item | null)[] =
    wantsOuter && outerwear.length ? outerwear : tempC < 24 && outerwear.length ? [null, ...outerwear] : [null];

  const candidates: { pieces: Item[]; score: number }[] = [];
  for (const base of bases) {
    for (const shoe of shoeOptions) {
      for (const outer of outerOptions) {
        const pieces = [...base, ...(outer ? [outer] : []), ...(shoe ? [shoe] : [])];
        const total =
          pieces.reduce((sum, p) => sum + score(p), 0) / pieces.length +
          pairHarmony(pieces) / pieces.length;
        candidates.push({ pieces, score: total });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score);

  // Pick distinct looks: different main piece each time while we can.
  const chosen: { pieces: Item[]; score: number }[] = [];
  const usedMain = new Set<string>();
  const mainKey = (pieces: Item[]) => pieces[0]._id + (pieces[1]?.category === "bottom" ? pieces[1]._id : "");
  for (const c of candidates) {
    if (chosen.length >= count) break;
    if (!usedMain.has(c.pieces[0]._id)) {
      chosen.push(c);
      usedMain.add(c.pieces[0]._id);
    }
  }
  const seen = new Set(chosen.map((c) => c.pieces.map((p) => p._id).sort().join()));
  for (const c of candidates) {
    if (chosen.length >= count) break;
    const key = c.pieces.map((p) => p._id).sort().join();
    if (!seen.has(key) && !chosen.some((x) => mainKey(x.pieces) === mainKey(c.pieces))) {
      chosen.push(c);
      seen.add(key);
    }
  }

  const suggestions = chosen.map(({ pieces, score: s }) => {
    // Add the best-matching accessory, if the wardrobe has any.
    let final = pieces;
    if (accessories.length) {
      const best = topK(
        accessories,
        1,
        (a) => score(a) + pairHarmony([a, ...pieces.slice(0, 2)]),
      )[0];
      final = [...pieces, best];
    }
    return { items: final, score: Math.round(s * 10) / 10, reasons: explain(pieces, target, tempC) };
  });

  return { suggestions, missing };
}

function explain(pieces: Item[], target: Formality, tempC: number): string[] {
  const reasons: string[] = [];
  const onTarget = pieces.filter((p) => p.formality === target).length;
  if (onTarget === pieces.length) reasons.push(`Every piece is ${target}, which fits the occasion.`);
  else if (onTarget >= pieces.length / 2) reasons.push(`Mostly ${target} pieces for the occasion.`);

  const needed = neededSeason(tempC);
  const label = needed === "spring-fall" ? "mild" : needed === "summer" ? "warm" : "cold";
  const good = pieces.every((p) => p.season === "all" || p.season === needed || p.season === "spring-fall");
  if (good) reasons.push(`Suits ${tempC}°C weather (${label}).`);

  if (pieces.length > 1 && pairHarmony(pieces) / ((pieces.length * (pieces.length - 1)) / 2) >= 1) {
    const names = [...new Set(pieces.slice(0, 3).map((p) => p.colorName))];
    reasons.push(`Colours work together: ${names.join(", ")}.`);
  }
  const fresh = pieces.find((p) => p.wearCount === 0);
  if (fresh) reasons.push(`Gives your ${fresh.name} an outing, since it hasn't been worn yet.`);
  return reasons.length ? reasons : ["A balanced combination from your wardrobe."];
}
