import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { category, formality, season } from "./schema";
import { requireUserId } from "./lib";

const MAX_ITEMS = 300;
const HEX = /^#[0-9a-fA-F]{6}$/;

function cleanName(name: string) {
  const n = name.trim().slice(0, 80);
  if (!n) throw new Error("Give the item a name");
  return n;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query("items")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(MAX_ITEMS);
    return await Promise.all(
      rows.map(async (row) => ({ ...row, url: await ctx.storage.getUrl(row.storageId) })),
    );
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category,
    colorHex: v.string(),
    colorName: v.string(),
    season,
    formality,
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    if (!HEX.test(args.colorHex)) throw new Error("Invalid colour");
    const existing = await ctx.db
      .query("items")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(MAX_ITEMS + 1);
    if (existing.length >= MAX_ITEMS) throw new Error(`Wardrobe is full (${MAX_ITEMS} items)`);
    return await ctx.db.insert("items", {
      ...args,
      name: cleanName(args.name),
      colorName: args.colorName.slice(0, 40),
      userId,
      wearCount: 0,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("items"),
    name: v.optional(v.string()),
    category: v.optional(category),
    colorHex: v.optional(v.string()),
    colorName: v.optional(v.string()),
    season: v.optional(season),
    formality: v.optional(formality),
  },
  handler: async (ctx, { id, ...patch }) => {
    const userId = await requireUserId(ctx);
    const item = await ctx.db.get(id);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    if (patch.colorHex !== undefined && !HEX.test(patch.colorHex)) throw new Error("Invalid colour");
    const clean: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(patch)) if (val !== undefined) clean[k] = val;
    if (patch.name !== undefined) clean.name = cleanName(patch.name);
    await ctx.db.patch(id, clean);
  },
});

export const remove = mutation({
  args: { id: v.id("items") },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const item = await ctx.db.get(id);
    if (!item || item.userId !== userId) throw new Error("Item not found");
    // Take the item out of any saved outfit first.
    const outfits = await ctx.db
      .query("outfits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const outfit of outfits) {
      if (outfit.itemIds.includes(id)) {
        await ctx.db.patch(outfit._id, { itemIds: outfit.itemIds.filter((x: string) => x !== id) });
      }
    }
    await ctx.storage.delete(item.storageId);
    await ctx.db.delete(id);
  },
});
