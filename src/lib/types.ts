export const CATEGORIES = ["top", "bottom", "dress", "outerwear", "shoes", "accessory"] as const;
export type Category = (typeof CATEGORIES)[number];

export const SEASONS = ["all", "summer", "winter", "spring-fall"] as const;
export type Season = (typeof SEASONS)[number];

export const FORMALITIES = ["casual", "smart", "formal"] as const;
export type Formality = (typeof FORMALITIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  top: "Tops",
  bottom: "Bottoms",
  dress: "Dresses",
  outerwear: "Outerwear",
  shoes: "Shoes",
  accessory: "Accessories",
};

export type Item = {
  _id: string;
  name: string;
  category: Category;
  colorHex: string;
  colorName: string;
  season: Season;
  formality: Formality;
  wearCount: number;
  url: string | null;
};

export type SavedOutfit = {
  _id: string;
  name: string;
  occasion: string;
  itemIds: string[];
  wornCount: number;
  lastWorn?: number;
};
