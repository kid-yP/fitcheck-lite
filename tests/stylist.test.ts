import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { colorName, dominantColor, harmonyScore, hexToHsl, rgbToHex } from "../src/lib/color";
import { generateSuggestions } from "../src/lib/stylist";
import type { Category, Formality, Item, Season } from "../src/lib/types";

let n = 0;
function item(
  name: string,
  category: Category,
  colorHex: string,
  formality: Formality = "casual",
  season: Season = "all",
  wearCount = 0,
): Item {
  n += 1;
  return { _id: `id${n}`, name, category, colorHex, colorName: colorName(colorHex), formality, season, wearCount, url: null };
}

const wardrobe: Item[] = [
  item("white tee", "top", "#f5f5f5", "casual", "summer"),
  item("navy shirt", "top", "#1c2a52", "smart", "all"),
  item("wool jumper", "top", "#8a8a8a", "casual", "winter"),
  item("white dress shirt", "top", "#ffffff", "formal", "all"),
  item("jeans", "bottom", "#2b3f6b", "casual", "all"),
  item("chinos", "bottom", "#b59a6b", "smart", "all"),
  item("suit trousers", "bottom", "#222222", "formal", "all"),
  item("linen shorts", "bottom", "#d8c9a8", "casual", "summer"),
  item("sneakers", "shoes", "#ffffff", "casual"),
  item("loafers", "shoes", "#4a2f1d", "smart"),
  item("oxfords", "shoes", "#111111", "formal"),
  item("puffer", "outerwear", "#222222", "casual", "winter"),
  item("blazer", "outerwear", "#1c2a52", "formal", "spring-fall"),
  item("watch", "accessory", "#c0c0c0", "smart"),
];

describe("colour helpers", () => {
  it("converts and names colours", () => {
    assert.equal(rgbToHex(255, 0, 0), "#ff0000");
    assert.equal(Math.round(hexToHsl("#00ff00")[0]), 120);
    assert.equal(colorName("#000000"), "black");
    assert.equal(colorName("#ffffff"), "white");
    assert.equal(colorName("#1c2a52"), "navy");
    assert.equal(colorName("#808080"), "grey");
  });
  it("scores harmony sensibly", () => {
    assert.ok(harmonyScore("#ffffff", "#ff0000") > 0, "neutral goes with anything");
    assert.ok(harmonyScore("#ff0000", "#ff3300") > 0, "similar hues match");
    assert.ok(harmonyScore("#ff0000", "#00cc66") < 0.5 + 1, "reds and greens are not a great match");
    assert.ok(harmonyScore("#ff0000", "#aaff00") < 0, "awkward hue gap is penalised");
  });
  it("finds the dominant colour and ignores transparent pixels", () => {
    const px: number[] = [];
    for (let i = 0; i < 50; i++) px.push(200, 20, 20, 255);
    for (let i = 0; i < 10; i++) px.push(0, 0, 255, 255);
    for (let i = 0; i < 500; i++) px.push(255, 255, 255, 0); // removed background
    const hex = dominantColor(px);
    assert.ok(hexToHsl(hex)[0] < 10 || hexToHsl(hex)[0] > 350, `expected red, got ${hex}`);
    assert.equal(dominantColor([]), "#808080");
  });
});

describe("stylist", () => {
  it("gives three distinct, complete looks", () => {
    const { suggestions, missing } = generateSuggestions(wardrobe, { occasion: "casual", tempC: 20 });
    assert.equal(missing.length, 0);
    assert.equal(suggestions.length, 3);
    const tops = new Set(suggestions.map((s) => s.items[0]._id));
    assert.equal(tops.size, 3, "each look starts with a different piece");
    for (const s of suggestions) {
      assert.ok(s.items.some((i) => i.category === "shoes"));
      assert.ok(s.reasons.length > 0);
    }
  });
  it("never puts a winter piece in hot weather", () => {
    const { suggestions } = generateSuggestions(wardrobe, { occasion: "casual", tempC: 32 });
    for (const s of suggestions) {
      assert.ok(!s.items.some((i) => i.season === "winter"), "no winter items at 32C");
      assert.ok(!s.items.some((i) => i.category === "outerwear"), "no coat at 32C");
    }
  });
  it("adds outerwear and avoids summer pieces when it is cold", () => {
    const { suggestions } = generateSuggestions(wardrobe, { occasion: "casual", tempC: 4 });
    for (const s of suggestions) {
      assert.ok(s.items.some((i) => i.category === "outerwear"));
      assert.ok(!s.items.some((i) => i.season === "summer"));
    }
  });
  it("prefers formal pieces for a formal event", () => {
    const { suggestions } = generateSuggestions(wardrobe, { occasion: "formal", tempC: 18 });
    const best = suggestions[0].items.map((i) => i.name);
    assert.ok(best.includes("suit trousers") && best.includes("oxfords"), best.join(", "));
  });
  it("explains what is missing instead of failing", () => {
    const empty = generateSuggestions([], { occasion: "work", tempC: 20 });
    assert.equal(empty.suggestions.length, 0);
    assert.ok(empty.missing.length > 0);
    const noShoes = generateSuggestions(wardrobe.filter((i) => i.category !== "shoes"), { occasion: "work", tempC: 20 });
    assert.ok(noShoes.missing.includes("shoes"));
    assert.ok(noShoes.suggestions.length > 0, "still suggests clothes without shoes");
  });
  it("works with dresses", () => {
    const w = [item("sun dress", "dress", "#cc3355", "smart", "summer"), item("sandals", "shoes", "#c9a27a")];
    const { suggestions } = generateSuggestions(w, { occasion: "date", tempC: 27 });
    assert.equal(suggestions.length, 1);
    assert.equal(suggestions[0].items[0].category, "dress");
  });
});
