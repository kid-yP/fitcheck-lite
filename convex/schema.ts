import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const category = v.union(
  v.literal("top"),
  v.literal("bottom"),
  v.literal("dress"),
  v.literal("outerwear"),
  v.literal("shoes"),
  v.literal("accessory"),
);
export const season = v.union(
  v.literal("all"),
  v.literal("summer"),
  v.literal("winter"),
  v.literal("spring-fall"),
);
export const formality = v.union(
  v.literal("casual"),
  v.literal("smart"),
  v.literal("formal"),
);

export default defineSchema({
  items: defineTable({
    userId: v.string(),
    name: v.string(),
    category,
    colorHex: v.string(),
    colorName: v.string(),
    season,
    formality,
    storageId: v.id("_storage"),
    wearCount: v.number(),
  }).index("by_user", ["userId"]),

  outfits: defineTable({
    userId: v.string(),
    name: v.string(),
    occasion: v.string(),
    itemIds: v.array(v.id("items")),
    wornCount: v.number(),
    lastWorn: v.optional(v.number()),
  }).index("by_user", ["userId"]),
});
