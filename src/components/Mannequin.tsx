import type { Item } from "@/lib/types";

type Box = { x: number; y: number; w: number; h: number };

// Where each kind of garment sits on the dress form (viewBox 300 x 620).
const SLOT: Record<string, Box> = {
  bottom: { x: 82, y: 248, w: 136, h: 236 },
  dress: { x: 56, y: 94, w: 188, h: 392 },
  top: { x: 62, y: 94, w: 176, h: 172 },
  outerwear: { x: 38, y: 90, w: 224, h: 256 },
  shoes: { x: 78, y: 492, w: 144, h: 92 },
};
const ACCESSORY_SLOTS: Box[] = [
  { x: 214, y: 292, w: 80, h: 80 },
  { x: 6, y: 292, w: 80, h: 80 },
];
const ORDER = ["bottom", "dress", "top", "outerwear", "shoes"] as const;

/** A flat "try-on": the garments laid onto a dress form. Free and instant. */
export function Mannequin({ items, className = "" }: { items: Item[]; className?: string }) {
  const accessories = items.filter((i) => i.category === "accessory").slice(0, 2);
  return (
    <svg
      viewBox="0 0 300 620"
      className={className}
      role="img"
      aria-label={items.length ? `Outfit: ${items.map((i) => i.name).join(", ")}` : "Empty dress form"}
    >
      <ellipse cx="150" cy="600" rx="96" ry="8" fill="var(--line)" opacity=".7" />
      <g fill="var(--surface-2)" stroke="var(--line)" strokeWidth="2">
        <circle cx="150" cy="52" r="26" />
        <rect x="140" y="74" width="20" height="24" />
        <path d="M96 104 Q150 88 204 104 L212 262 L88 262 Z" />
        <rect x="100" y="258" width="46" height="300" rx="14" />
        <rect x="154" y="258" width="46" height="300" rx="14" />
      </g>
      {ORDER.map((slot) =>
        items
          .filter((i) => i.category === slot && i.url)
          .slice(0, 1)
          .map((i) => (
            <image
              key={i._id}
              href={i.url!}
              {...SLOT[slot]}
              width={SLOT[slot].w}
              height={SLOT[slot].h}
              preserveAspectRatio="xMidYMid meet"
            />
          )),
      )}
      {accessories.map((a, idx) =>
        a.url ? (
          <image
            key={a._id}
            href={a.url}
            {...ACCESSORY_SLOTS[idx]}
            width={ACCESSORY_SLOTS[idx].w}
            height={ACCESSORY_SLOTS[idx].h}
            preserveAspectRatio="xMidYMid meet"
          />
        ) : null,
      )}
    </svg>
  );
}
