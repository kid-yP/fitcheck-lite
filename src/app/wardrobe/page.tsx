"use client";

import { useMutation } from "convex/react";
import Link from "next/link";
import { useState } from "react";
import { CheckIcon } from "@/components/Icons";
import { PageHead } from "@/components/PageHead";
import { api } from "@/lib/api";
import { colorName } from "@/lib/color";
import { useItems, useOutfits } from "@/lib/hooks";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  FORMALITIES,
  SEASONS,
  type Category,
  type Formality,
  type Item,
  type Season,
} from "@/lib/types";

function Editor({ item, onClose }: { item: Item; onClose: () => void }) {
  const update = useMutation(api.items.update);
  const remove = useMutation(api.items.remove);
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState<Category>(item.category);
  const [season, setSeason] = useState<Season>(item.season);
  const [formality, setFormality] = useState<Formality>(item.formality);
  const [colorHex, setColorHex] = useState(item.colorHex);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-sm overflow-y-auto border-l border-line bg-surface p-5 shadow-xl" aria-label="Edit item">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold tracking-tight text-xl">Edit piece</h2>
        <button className="text-sm underline" onClick={onClose}>Close</button>
      </div>
      <div className="checker mt-4 flex aspect-square items-center justify-center rounded">
        {item.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt={item.name} className="max-h-full max-w-full object-contain" />
        )}
      </div>
      <p className="mt-2 text-xs text-muted">Worn {item.wearCount} {item.wearCount === 1 ? "time" : "times"}</p>
      <div className="mt-4 space-y-3">
        <input className="field" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} aria-label="Name" />
        <select className="field" value={category} onChange={(e) => setCategory(e.target.value as Category)} aria-label="Category">
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
        </select>
        <select className="field" value={formality} onChange={(e) => setFormality(e.target.value as Formality)} aria-label="Formality">
          {FORMALITIES.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <select className="field" value={season} onChange={(e) => setSeason(e.target.value as Season)} aria-label="Season">
          {SEASONS.map((s) => <option key={s} value={s}>{s === "all" ? "all seasons" : s}</option>)}
        </select>
        <label className="flex items-center gap-3 text-sm">
          <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-line" />
          {colorName(colorHex)}
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button
            className="btn flex-1"
            disabled={busy}
            onClick={() => run(() => update({ id: item._id, name, category, season, formality, colorHex, colorName: colorName(colorHex) }))}
          >
            Save changes
          </button>
          <button
            className="btn btn-ghost"
            disabled={busy}
            onClick={() => {
              if (confirm(`Delete "${item.name}"? This cannot be undone.`)) void run(() => remove({ id: item._id }));
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function Wardrobe() {
  const items = useItems();
  const outfits = useOutfits();
  const remove = useMutation(api.items.remove);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [formality, setFormality] = useState<Formality | "all">("all");
  const [season, setSeason] = useState<Season | "all">("all");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Item | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  if (items === undefined) return <p className="text-muted">Loading your wardrobe…</p>;

  const shown = items.filter(
    (i) =>
      (filter === "all" || i.category === filter) &&
      (formality === "all" || i.formality === formality) &&
      (season === "all" || i.season === season || i.season === "all") &&
      (!query || `${i.name} ${i.colorName}`.toLowerCase().includes(query.toLowerCase())),
  );
  const neverWorn = items.filter((i) => i.wearCount === 0).length;
  const mostWorn = [...items].sort((a, b) => b.wearCount - a.wearCount)[0];

  async function deleteSelected() {
    if (!confirm(`Delete ${selected.length} piece${selected.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
    setBusy(true);
    for (const id of selected) await remove({ id });
    setSelected([]);
    setSelecting(false);
    setBusy(false);
  }

  return (
    <div>
      <PageHead
        eyebrow="Your closet"
        title="Wardrobe."
        sub="Every piece you own, in one place. Click a piece to edit it."
        actions={
          <>
            {items.length > 0 && (
              <button className="btn btn-ghost" onClick={() => { setSelecting((s) => !s); setSelected([]); }}>
                {selecting ? "Cancel" : "Select"}
              </button>
            )}
            <Link href="/add" className="btn btn-accent">Add clothes</Link>
          </>
        }
      />

      {items.length > 0 && (
        <dl className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Pieces", String(items.length)],
            ["Outfits saved", outfits ? String(outfits.length) : "…"],
            ["Never worn", String(neverWorn)],
            ["Most worn", mostWorn && mostWorn.wearCount > 0 ? `${mostWorn.name} (${mostWorn.wearCount}×)` : "—"],
          ].map(([label, value]) => (
            <div key={label} className="card px-4 py-3">
              <dt className="label">{label}</dt>
              <dd className="display mt-2 truncate text-2xl">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {items.length === 0 ? (
        <div className="card mt-10 border-dashed p-12 text-center">
          <p className="font-semibold tracking-tight text-2xl">Your closet is empty</p>
          <p className="mt-1 text-muted">Photograph something you own to get started.</p>
          <Link href="/add" className="btn mt-5">Add your first piece</Link>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {(["all", ...CATEGORIES] as const).map((c) => (
              <button key={c} onClick={() => setFilter(c)} aria-pressed={filter === c} className="chip">
                {c === "all" ? "All" : CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <select className="field" aria-label="Formality filter" value={formality} onChange={(e) => setFormality(e.target.value as Formality | "all")}>
              <option value="all">Any formality</option>
              {FORMALITIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <select className="field" aria-label="Season filter" value={season} onChange={(e) => setSeason(e.target.value as Season | "all")}>
              <option value="all">Any season</option>
              {SEASONS.filter((s) => s !== "all").map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input className="field" placeholder="Search name or colour" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search" />
          </div>

          {selecting && (
            <div className="mt-4 flex items-center gap-3 rounded bg-inverse px-4 py-2 text-sm text-on-inverse">
              <span>{selected.length} selected</span>
              <button className="underline" onClick={() => setSelected(shown.map((i) => i._id))}>Select all shown</button>
              <span className="flex-1" />
              <button className="btn btn-accent !py-1" disabled={!selected.length || busy} onClick={() => void deleteSelected()}>
                {busy ? "Deleting…" : "Delete selected"}
              </button>
            </div>
          )}

          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            {shown.map((item) => {
              const on = selected.includes(item._id);
              return (
                <li key={item._id}>
                  <button
                    onClick={() =>
                      selecting
                        ? setSelected((s) => (on ? s.filter((x) => x !== item._id) : [...s, item._id]))
                        : setEditing(item)
                    }
                    className="group block w-full text-left"
                    aria-pressed={selecting ? on : undefined}
                  >
                    <div className={`checker relative flex aspect-[4/5] items-center justify-center overflow-hidden rounded-lg border ${on ? "border-ink ring-2 ring-accent" : "border-line"}`}>
                      {item.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.url} alt={item.name} className="max-h-[88%] max-w-[88%] object-contain transition-transform group-hover:scale-105" />
                      )}
                      {selecting && (
                        <span className={`absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border ${on ? "border-ink bg-accent" : "border-line bg-surface"}`}>
                          {on && <CheckIcon className="h-4 w-4" />}
                        </span>
                      )}
                      <span className="absolute bottom-2 right-2 rounded-full bg-surface/90 px-2 py-0.5 text-[11px] font-semibold">
                        {item.wearCount}×
                      </span>
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold">{item.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-muted">
                      <span className="inline-block h-3 w-3 rounded-full border border-line" style={{ background: item.colorHex }} />
                      {item.colorName} · {item.formality}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
          {shown.length === 0 && <p className="mt-8 text-muted">No pieces match those filters.</p>}
        </>
      )}
      {editing && <Editor key={editing._id} item={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
