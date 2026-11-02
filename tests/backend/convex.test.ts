/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { anyApi } from "convex/server";
import { describe, expect, it } from "vitest";
import schema from "../../convex/schema";

// convex-test wants to see a `_generated` folder; `npx convex dev` makes the real one,
// so for these tests we just add a placeholder entry.
const modules = {
  ...import.meta.glob("../../convex/**/*.ts"),
  "../../convex/_generated/api.js": async () => ({}),
};
const api = anyApi;

function setup() {
  const t = convexTest(schema, modules);
  return { t, alice: t.withIdentity({ subject: "user_alice" }), bob: t.withIdentity({ subject: "user_bob" }) };
}

async function addItem(as: ReturnType<typeof setup>["alice"], name = "Blue jeans", category = "bottom") {
  const storageId = await as.run(async (ctx) => ctx.storage.store(new Blob(["x"], { type: "image/png" })));
  return await as.mutation(api.items.create, {
    name,
    category,
    colorHex: "#2b3f6b",
    colorName: "navy",
    season: "all",
    formality: "casual",
    storageId,
  });
}

describe("convex backend", () => {
  it("rejects anonymous callers", async () => {
    const { t } = setup();
    await expect(t.query(api.items.list, {})).rejects.toThrow(/Not signed in/);
    await expect(t.mutation(api.items.generateUploadUrl, {})).rejects.toThrow(/Not signed in/);
  });

  it("creates and lists items for the signed-in user only", async () => {
    const { alice, bob } = setup();
    await addItem(alice, "Alice jeans");
    await addItem(bob, "Bob chinos");
    const a = await alice.query(api.items.list, {});
    const b = await bob.query(api.items.list, {});
    expect(a.map((i: { name: string }) => i.name)).toEqual(["Alice jeans"]);
    expect(b.map((i: { name: string }) => i.name)).toEqual(["Bob chinos"]);
    expect(a[0].url).toBeTruthy();
    expect(a[0].wearCount).toBe(0);
  });

  it("validates input", async () => {
    const { alice } = setup();
    const storageId = await alice.run(async (ctx) => ctx.storage.store(new Blob(["x"])));
    const base = { name: "Tee", category: "top", colorName: "red", season: "all", formality: "casual", storageId };
    await expect(alice.mutation(api.items.create, { ...base, colorHex: "red" })).rejects.toThrow(/Invalid colour/);
    await expect(alice.mutation(api.items.create, { ...base, colorHex: "#ff0000", name: "   " })).rejects.toThrow(/name/);
    await expect(alice.mutation(api.items.create, { ...base, colorHex: "#ff0000", category: "hat" })).rejects.toThrow();
  });

  it("stops other users editing or deleting your items", async () => {
    const { alice, bob } = setup();
    const id = await addItem(alice);
    await expect(bob.mutation(api.items.update, { id, name: "Hacked" })).rejects.toThrow(/not found/i);
    await expect(bob.mutation(api.items.remove, { id })).rejects.toThrow(/not found/i);
    await alice.mutation(api.items.update, { id, name: "Renamed", formality: "smart" });
    const [item] = await alice.query(api.items.list, {});
    expect(item.name).toBe("Renamed");
    expect(item.formality).toBe("smart");
  });

  it("builds outfits, counts wears, and cleans up when an item is deleted", async () => {
    const { alice, bob } = setup();
    const jeans = await addItem(alice, "Jeans", "bottom");
    const tee = await addItem(alice, "Tee", "top");
    const bobItem = await addItem(bob, "Bob tee", "top");

    await expect(alice.mutation(api.outfits.save, { name: "Solo", occasion: "", itemIds: [jeans] })).rejects.toThrow(/between 2 and 8/);
    await expect(alice.mutation(api.outfits.save, { name: "Steal", occasion: "", itemIds: [jeans, bobItem] })).rejects.toThrow(/not found/);

    const outfitId = await alice.mutation(api.outfits.save, { name: "Casual Friday", occasion: "Work", itemIds: [jeans, tee] });
    expect(await bob.query(api.outfits.list, {})).toHaveLength(0);
    await expect(bob.mutation(api.outfits.markWorn, { id: outfitId })).rejects.toThrow(/not found/i);

    await alice.mutation(api.outfits.markWorn, { id: outfitId });
    await alice.mutation(api.outfits.markWorn, { id: outfitId });
    const [outfit] = await alice.query(api.outfits.list, {});
    expect(outfit.wornCount).toBe(2);
    const items = await alice.query(api.items.list, {});
    expect(items.every((i: { wearCount: number }) => i.wearCount === 2)).toBe(true);

    await alice.mutation(api.items.remove, { id: tee });
    const [after] = await alice.query(api.outfits.list, {});
    expect(after.itemIds).toEqual([jeans]);
  });
});
