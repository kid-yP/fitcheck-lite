import { mutationGeneric as mutation, queryGeneric as query } from "convex/server";
import { v } from "convex/values";
import { requireUserId } from "./lib";

const MAX_OUTFITS = 200;

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    return await ctx.db
      .query("outfits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(MAX_OUTFITS);
  },
});

export const save = mutation({
  args: { name: v.string(), occasion: v.string(), itemIds: v.array(v.id("items")) },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const name = args.name.trim().slice(0, 80);
    if (!name) throw new Error("Give the outfit a name");
    if (args.itemIds.length < 2 || args.itemIds.length > 8) {
      throw new Error("An outfit needs between 2 and 8 pieces");
    }
    for (const id of args.itemIds) {
      const item = await ctx.db.get(id);
      if (!item || item.userId !== userId) throw new Error("One of the pieces was not found");
    }
    const count = (
      await ctx.db
        .query("outfits")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .take(MAX_OUTFITS + 1)
    ).length;
    if (count >= MAX_OUTFITS) throw new Error("Too many saved outfits");
    return await ctx.db.insert("outfits", {
      userId,
      name,
      occasion: args.occasion.trim().slice(0, 60),
      itemIds: args.itemIds,
      wornCount: 0,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("outfits") },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const outfit = await ctx.db.get(id);
    if (!outfit || outfit.userId !== userId) throw new Error("Outfit not found");
    await ctx.db.delete(id);
  },
});

export const markWorn = mutation({
  args: { id: v.id("outfits") },
  handler: async (ctx, { id }) => {
    const userId = await requireUserId(ctx);
    const outfit = await ctx.db.get(id);
    if (!outfit || outfit.userId !== userId) throw new Error("Outfit not found");
    await ctx.db.patch(id, { wornCount: outfit.wornCount + 1, lastWorn: Date.now() });
    for (const itemId of outfit.itemIds) {
      const item = await ctx.db.get(itemId);
      if (item && item.userId === userId) {
        await ctx.db.patch(itemId, { wearCount: item.wearCount + 1 });
      }
    }
  },
});
