"use client";

import { useConvexAuth, useQuery } from "convex/react";
import { api } from "./api";
import type { Item, SavedOutfit } from "./types";

/** undefined = still loading. Waits until Convex has accepted the Clerk token. */
export function useItems(): Item[] | undefined {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.items.list, isAuthenticated ? {} : "skip") as Item[] | undefined;
}

export function useOutfits(): SavedOutfit[] | undefined {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(api.outfits.list, isAuthenticated ? {} : "skip") as SavedOutfit[] | undefined;
}
