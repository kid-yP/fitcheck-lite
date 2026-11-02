"use client";

import { useMutation } from "convex/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { UploadIcon } from "@/components/Icons";
import { PageHead } from "@/components/PageHead";
import { useItems } from "@/lib/hooks";
import { colorName } from "@/lib/color";
import { api } from "@/lib/api";
import { detectColor, downscale, guessCategory, prettyName, removeBackground } from "@/lib/image";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  FORMALITIES,
  SEASONS,
  type Category,
  type Formality,
  type Season,
} from "@/lib/types";

type Draft = {
  id: string;
  fileName: string;
  blob: Blob | null;
  preview: string | null;
  name: string;
  category: Category;
  season: Season;
  formality: Formality;
  colorHex: string;
  status: "processing" | "ready" | "saving" | "saved" | "error";
  note: string;
};

const MAX_FILES = 10;
let counter = 0;

export default function AddClothes() {
  const generateUploadUrl = useMutation(api.items.generateUploadUrl);
  const createItem = useMutation(api.items.create);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [removeBg, setRemoveBg] = useState(true);
  const [dragging, setDragging] = useState(false);
  const recent = useItems()?.slice(0, 8) ?? [];
  const inputRef = useRef<HTMLInputElement>(null);

  const patch = (id: string, change: Partial<Draft>) =>
    setDrafts((list) => list.map((d) => (d.id === id ? { ...d, ...change } : d)));

  async function processFile(file: File, id: string) {
    try {
      if (!file.type.startsWith("image/")) throw new Error("That file is not an image.");
      let blob: Blob = await downscale(file, 1024, "image/jpeg");
      if (removeBg) {
        try {
          patch(id, { note: "Removing background (first time downloads the AI model)…" });
          blob = await removeBackground(blob, (p) => patch(id, { note: `Removing background… ${p}%` }));
        } catch (err) {
          console.error(err);
          patch(id, { note: "Background removal didn't work, so the original photo is used." });
        }
      }
      const colorHex = await detectColor(blob);
      patch(id, {
        blob,
        preview: URL.createObjectURL(blob),
        colorHex,
        status: "ready",
        note: "",
      });
    } catch (err) {
      patch(id, { status: "error", note: err instanceof Error ? err.message : "Could not read this photo." });
    }
  }

  function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const chosen = Array.from(files).slice(0, MAX_FILES);
    const fresh: Draft[] = chosen.map((file) => ({
      id: `d${++counter}`,
      fileName: file.name,
      blob: null,
      preview: null,
      name: prettyName(file.name),
      category: guessCategory(file.name) as Category,
      season: "all",
      formality: "casual",
      colorHex: "#808080",
      status: "processing",
      note: "Preparing…",
    }));
    setDrafts((list) => [...list, ...fresh]);
    // Process one at a time: the background-removal model is heavy.
    void (async () => {
      for (let i = 0; i < chosen.length; i++) await processFile(chosen[i], fresh[i].id);
    })();
    if (inputRef.current) inputRef.current.value = "";
  }

  async function save(d: Draft) {
    if (!d.blob) return;
    patch(d.id, { status: "saving", note: "Saving…" });
    try {
      const uploadUrl = await generateUploadUrl({});
      const res = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": d.blob.type || "image/png" },
        body: d.blob,
      });
      if (!res.ok) throw new Error("Upload failed. Please try again.");
      const { storageId } = (await res.json()) as { storageId: string };
      await createItem({
        name: d.name,
        category: d.category,
        colorHex: d.colorHex,
        colorName: colorName(d.colorHex),
        season: d.season,
        formality: d.formality,
        storageId,
      });
      patch(d.id, { status: "saved", note: "" });
    } catch (err) {
      patch(d.id, { status: "ready", note: err instanceof Error ? err.message : "Could not save." });
    }
  }

  const readyCount = drafts.filter((d) => d.status === "ready").length;

  return (
    <div>
      <PageHead eyebrow="Wardrobe studio" title="Add clothes." sub="Drop photos in. We cut out the piece, read its colour, and you confirm the details." />

      <div className="mt-8 grid gap-10 lg:grid-cols-[360px_1fr]">
        <div>
          <p className="label">01 / Your photos</p>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
            className={`mt-3 flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${dragging ? "border-ink bg-accent/20" : "border-line bg-surface"}`}
          >
            <UploadIcon className="h-7 w-7 text-muted" />
            <p className="mt-3 font-semibold tracking-tight">Drop your photos here</p>
            <p className="mt-1 text-sm text-muted">One piece per photo. Up to {MAX_FILES} at a time.</p>
            <label className="btn mt-5 cursor-pointer">
              Select photos
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => onFiles(e.target.files)} />
            </label>
            <p className="label mt-4">JPG · PNG · WebP</p>
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} />
            Remove background (recommended)
          </label>
          <details className="mt-6 border-t border-line pt-4 text-sm text-muted">
            <summary className="label cursor-pointer">Tips for a cleaner cutout</summary>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              <li>Lay the piece flat on a plain floor or bed.</li>
              <li>Use even light, with no harsh shadows.</li>
              <li>Fill the frame, and keep the piece fully in the photo.</li>
              <li>The first photo downloads a small AI model, so it takes longer.</li>
            </ul>
          </details>
        </div>

        <div className="min-w-0">
          <p className="label">02 / Review and save</p>
          {drafts.length === 0 && (
            <p className="card mt-3 border-dashed p-10 text-center text-muted">Nothing to review yet. Add a photo on the left.</p>
          )}
          {drafts.length > 0 && (
        <>
          <div className="mt-8 flex items-center justify-between">
            <h2 className="font-semibold tracking-tight text-xl">Review {drafts.length} {drafts.length === 1 ? "photo" : "photos"}</h2>
            {readyCount > 1 && (
              <button
                className="btn"
                onClick={async () => {
                  for (const d of drafts.filter((x) => x.status === "ready")) await save(d);
                }}
              >
                Save all {readyCount}
              </button>
            )}
          </div>
          <ul className="mt-3 grid gap-3">
            {drafts.map((d) => (
              <li key={d.id} className="card grid grid-cols-[130px_1fr] gap-4 p-4">
                <div className="checker flex aspect-square items-center justify-center overflow-hidden rounded-lg">
                  {d.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.preview} alt={d.name} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="px-2 text-center text-xs text-muted">{d.status === "error" ? "—" : "Working…"}</span>
                  )}
                </div>
                <div className="min-w-0 space-y-2">
                  {d.status === "error" ? (
                    <p className="text-sm text-red-700">{d.note}</p>
                  ) : d.status === "saved" ? (
                    <p className="text-sm font-semibold">Saved ✓ <Link className="underline" href="/wardrobe">View wardrobe</Link></p>
                  ) : (
                    <>
                      <input className="field" value={d.name} maxLength={80} aria-label="Name" onChange={(e) => patch(d.id, { name: e.target.value })} />
                      <div className="grid grid-cols-2 gap-2">
                        <select className="field" aria-label="Category" value={d.category} onChange={(e) => patch(d.id, { category: e.target.value as Category })}>
                          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                        </select>
                        <select className="field" aria-label="Formality" value={d.formality} onChange={(e) => patch(d.id, { formality: e.target.value as Formality })}>
                          {FORMALITIES.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <select className="field" aria-label="Season" value={d.season} onChange={(e) => patch(d.id, { season: e.target.value as Season })}>
                          {SEASONS.map((s) => <option key={s} value={s}>{s === "all" ? "all seasons" : s}</option>)}
                        </select>
                        <label className="flex items-center gap-2 text-sm">
                          <input type="color" value={d.colorHex} onChange={(e) => patch(d.id, { colorHex: e.target.value })} aria-label="Colour" className="h-9 w-12 cursor-pointer rounded border border-line" />
                          {colorName(d.colorHex)}
                        </label>
                      </div>
                      {d.note && <p className="text-xs text-muted">{d.note}</p>}
                      <button className="btn" disabled={d.status !== "ready"} onClick={() => save(d)}>
                        {d.status === "saving" ? "Saving…" : d.status === "processing" ? "Processing…" : "Save to wardrobe"}
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {recent.length > 0 && (
        <section className="mt-10 border-t border-line pt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold tracking-tight text-xl">Recently added</h2>
            <Link href="/wardrobe" className="text-sm underline">See all</Link>
          </div>
          <ul className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-8">
            {recent.map((i) => (
              <li key={i._id} title={i.name} className="checker flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-line">
                {i.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.url} alt={i.name} className="max-h-[85%] max-w-[85%] object-contain" />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
        </div>
      </div>
    </div>
  );
}
