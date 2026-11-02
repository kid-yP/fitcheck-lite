"use client";

import { useMutation } from "convex/react";
import Link from "next/link";
import { Mannequin } from "@/components/Mannequin";
import { PageHead } from "@/components/PageHead";
import { api } from "@/lib/api";
import { useItems, useOutfits } from "@/lib/hooks";

export default function Outfits() {
  const items = useItems();
  const outfits = useOutfits();
  const markWorn = useMutation(api.outfits.markWorn);
  const remove = useMutation(api.outfits.remove);

  if (!items || !outfits) return <p className="text-muted">Loading outfits…</p>;
  const byId = new Map(items.map((i) => [i._id, i]));

  return (
    <div>
      <PageHead
        eyebrow={`Lookbook / ${outfits.length} saved`}
        title="Outfits."
        sub="Looks you have saved. Mark one as worn and the pieces keep count."
        actions={<Link href="/outfits/new" className="btn btn-accent">New outfit</Link>}
      />

      {outfits.length === 0 ? (
        <div className="card mt-10 border-dashed p-12 text-center">
          <p className="font-semibold tracking-tight text-2xl">No outfits yet</p>
          <p className="mt-1 text-muted">Build one yourself, or let the stylist suggest some.</p>
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/outfits/new" className="btn">Build an outfit</Link>
            <Link href="/stylist" className="btn btn-ghost">Ask the stylist</Link>
          </div>
        </div>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {outfits.map((o) => {
            const pieces = o.itemIds.map((id) => byId.get(id)).filter((x) => !!x);
            return (
              <li key={o._id} className="card overflow-hidden">
                <div className="checker py-3">
                  <Mannequin items={pieces} className="mx-auto h-80" />
                </div>
                <div className="p-4">
                  <h2 className="font-semibold tracking-tight text-xl">{o.name}</h2>
                  <p className="text-sm text-muted">
                    {o.occasion || "No occasion"} · worn {o.wornCount}×
                    {o.lastWorn ? ` · last ${new Date(o.lastWorn).toLocaleDateString()}` : ""}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {pieces.map((p) => (
                      <li key={p._id} className="chip flex items-center gap-1.5 !py-0.5 text-xs">
                        <span className="inline-block h-2.5 w-2.5 rounded-full border border-line" style={{ background: p.colorHex }} />
                        {p.name}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 flex gap-2">
                    <button className="btn flex-1" onClick={() => void markWorn({ id: o._id })}>I wore this today</button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        if (confirm(`Delete "${o.name}"?`)) void remove({ id: o._id });
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
