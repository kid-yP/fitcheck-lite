"use client";

import { useMemo, useState } from "react";
import { DEMO_WARDROBE } from "@/lib/garmentArt";
import { generateSuggestions, OCCASIONS, type Occasion } from "@/lib/stylist";
import { Mannequin } from "./Mannequin";

/** The real styling engine running on a sample wardrobe: no sign-in, no server, no AI. */
export function DemoStudio() {
  const [occasion, setOccasion] = useState<Occasion>("casual");
  const [tempC, setTempC] = useState(18);
  const { suggestions } = useMemo(() => generateSuggestions(DEMO_WARDROBE, { occasion, tempC }), [occasion, tempC]);

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <div className="card h-fit p-5">
        <p className="label">01 / The occasion</p>
        <div role="radiogroup" aria-label="Occasion" className="mt-3 flex flex-wrap gap-2">
          {OCCASIONS.map((o) => (
            <button key={o.id} role="radio" aria-checked={occasion === o.id} onClick={() => setOccasion(o.id)} className="chip">
              {o.label}
            </button>
          ))}
        </div>
        <p className="label mt-6">02 / The weather</p>
        <p className="display mt-2 text-6xl tabular-nums">{tempC}°<span className="text-2xl text-muted">C</span></p>
        <input
          type="range"
          min={-5}
          max={38}
          value={tempC}
          onChange={(e) => setTempC(Number(e.target.value))}
          aria-label="Temperature in degrees Celsius"
          className="mt-2 w-full accent-[var(--ink)]"
        />
        <p className="mt-4 text-sm text-muted">
          Drag the slider. Coats appear below 16°, shorts above 24°, and formal events pick formal pieces.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-3">
        {suggestions.map((s, i) => (
          <li key={s.items.map((x) => x._id).join()} className="card overflow-hidden">
            <div className="checker py-3">
              <Mannequin items={s.items} className="mx-auto h-64" />
            </div>
            <div className="p-4">
              <p className="label">Look 0{i + 1}</p>
              <p className="mt-1 text-sm font-medium">{s.items.map((x) => x.name).join(" · ")}</p>
              <p className="mt-2 text-xs text-muted">{s.reasons[0]}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
