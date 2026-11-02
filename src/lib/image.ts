"use client";

import { dominantColor } from "./color";

/** Shrinks a photo so uploads stay small and fast. Returns a PNG or JPEG blob. */
export async function downscale(file: Blob, maxSide = 1024, type = "image/jpeg"): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image type is not supported. Please use JPG, PNG or WebP.");
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser could not process the image.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not compress image"))), type, 0.9),
  );
}

/**
 * Cuts the background out of a photo, entirely inside the browser (free, no API).
 * The first call downloads a ~40-80MB AI model, which the browser then caches.
 */
export async function removeBackground(
  file: Blob,
  onProgress?: (percent: number) => void,
): Promise<Blob> {
  const { removeBackground: remove } = await import("@imgly/background-removal");
  return await remove(file, {
    output: { format: "image/png" },
    progress: (_key, current, total) => {
      if (onProgress && total > 0) onProgress(Math.round((current / total) * 100));
    },
  });
}

/** The main colour of a (possibly transparent) image, as #rrggbb. */
export async function detectColor(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "#808080";
  // Keep the aspect ratio, centred.
  const scale = Math.min(size / bitmap.width, size / bitmap.height);
  const w = bitmap.width * scale;
  const h = bitmap.height * scale;
  ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
  bitmap.close();
  return dominantColor(ctx.getImageData(0, 0, size, size).data);
}

const GUESSES: [RegExp, string][] = [
  [/dress|gown/i, "dress"],
  [/coat|jacket|blazer|hoodie|cardigan|parka|puffer|trench/i, "outerwear"],
  [/shoe|sneaker|boot|loafer|sandal|heel|trainer|oxford/i, "shoes"],
  [/jean|trouser|pant|short|skirt|chino|legging/i, "bottom"],
  [/watch|bag|belt|hat|cap|scarf|glasses|tie|jewel|necklace/i, "accessory"],
  [/shirt|tee|t-shirt|top|jumper|sweater|blouse|polo|tank/i, "top"],
];

/** Guess a category from the file name, e.g. "blue-jeans.jpg" → "bottom". */
export function guessCategory(fileName: string): string {
  return GUESSES.find(([re]) => re.test(fileName))?.[1] ?? "top";
}

export function prettyName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return base ? base.charAt(0).toUpperCase() + base.slice(1, 60) : "New item";
}
