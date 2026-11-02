"use client";

import { useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mannequin } from "@/components/Mannequin";
import { api } from "@/lib/api";
import { useItems } from "@/lib/hooks";
import { CATEGORY_LABEL, type Category } from "@/lib/types";

const SLOTS: Category[] = ["outerwear", "top", "dress", "bottom", "shoes", "accessory"];

export default function OutfitStudio() {
  const items = useItems();
  const save = useMutation(api.outfits.save);
  const router = useRouter();
  const [picked, setPicked] = useState<string[]>([]);
  const [active, setActive] = useState<Category>("top");
  const [name, setName] = useState("");
  const [occasion, setOccasion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!items) return <p className="text-muted">Loading…</p>;
  if (items.length < 2) {
    return (
      <div>
        <h1 className="display text-5xl">Outfit studio</h1>
        <p className="mt-3 text-muted">You need at least two pieces in your wardrobe first.</p>
        <Link href="/add" className="btn mt-4">Add clothes</Link>
      </div>
    );
  }

  const byId = new Map(items.map((i) => [i._id, i]));
  const selected = picked.map((id) => byId.get(id)).filter((x) => !!x);
  const inSlot = (c: Category) => selected.filter((i) => i.category === c);

  function toggle(id: string, category: Category) {
    setPicked((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      const cat = (x: string) => byId.get(x)?.category;
      let next = current;
      if (category === "dress") next = next.filter((x) => cat(x) !== "top" && cat(x) !== "bottom");
      if (category === "top" || category === "bottom") next = next.filter((x) => cat(x) !== "dress");
      if (category === "accessory") {
        const acc = next.filter((x) => cat(x) === "accessory");
        if (acc.length >= 2) next = next.filter((x) => x !== acc[0]);
      } else {
        next = next.filter((x) => cat(x) !== category);
      }
      return [...next, id];
    });
  }

  async function onSave() {
    setBusy(true);
    setError("");
    try {
      await save({ name: name || "New outfit", occasion, itemIds: picked });
      router.push("/outfits");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      setBusy(false);
    }
  }

  const options = items.filter((i) => i.category === active);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(320px,440px)_1fr]">
      {/* The look: the main image, like a try-on result */}
      <section className="xl:sticky xl:top-6 xl:self-start">
        <p className="label">The outfit studio / styled by you</p>
        <div className="checker mt-2 rounded-2xl border border-line py-4">
          <Mannequin items={selected} className="mx-auto h-[min(62vh,560px)]" />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <input className="field" placeholder="Outfit name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} aria-label="Outfit name" />
          <input className="field" placeholder="Occasion (e.g. Friday at work)" value={occasion} maxLength={60} onChange={(e) => setOccasion(e.target.value)} aria-label="Occasion" />
        </div>
        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
        <button className="btn mt-3 w-full !py-3" disabled={busy || picked.length < 2} onClick={onSave}>
          {picked.length < 2 ? "Pick at least 2 pieces" : busy ? "Saving…" : "Save outfit"}
        </button>
      </section>

      {/* The pieces alongside it */}
      <section>
        <h1 className="display text-4xl">Pieces</h1>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {SLOTS.map((cat) => {
            const chosen = inSlot(cat);
            const count = items.filter((i) => i.category === cat).length;
            return (
              <li key={cat} className={`card flex items-center gap-3 p-3 ${active === cat ? "ring-2 ring-accent" : ""}`}>
                <div className="checker flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded">
                  {chosen[0]?.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={chosen[0].url} alt="" className="max-h-full max-w-full object-contain" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{CATEGORY_LABEL[cat]}</p>
                  <p className="truncate text-xs text-muted">
                    {chosen.length ? chosen.map((c) => c.name).join(", ") : count ? "Nothing chosen" : "None in wardrobe"}
                  </p>
                </div>
                <button className="btn btn-ghost !px-2 !py-1 text-xs" disabled={!count} onClick={() => setActive(cat)}>
                  {chosen.length ? "Replace" : "Choose"}
                </button>
                {chosen.length > 0 && (
                  <button className="text-xs underline" onClick={() => chosen.forEach((c) => toggle(c._id, cat))}>
                    Remove
                  </button>
                )}
              </li>
            );
          })}
        </ul>

        <h2 className="mt-8 font-semibold tracking-tight text-xl">
          {CATEGORY_LABEL[active]}
          {active === "accessory" && <span className="text-sm font-normal text-muted"> (up to 2)</span>}
        </h2>
        {options.length === 0 ? (
          <p className="mt-3 text-muted">
            You haven&apos;t added any {CATEGORY_LABEL[active].toLowerCase()} yet. <Link href="/add" className="underline">Add some</Link>.
          </p>
        ) : (
          <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {options.map((i) => {
              const on = picked.includes(i._id);
              return (
                <li key={i._id}>
                  <button
                    onClick={() => toggle(i._id, active)}
                    aria-pressed={on}
                    className={`block w-full rounded-lg border p-1 text-left ${on ? "border-ink ring-2 ring-accent" : "border-line"}`}
                  >
                    <div className="checker flex aspect-square items-center justify-center rounded">
                      {i.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={i.url} alt="" className="max-h-full max-w-full object-contain" />
                      )}
                    </div>
                    <span className="mt-1 block truncate text-xs">{i.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
