"use client";

import { useMutation } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useItems } from "@/lib/hooks";
import { generateSuggestions, OCCASIONS, type Occasion, type Suggestion } from "@/lib/stylist";
import { Mannequin } from "./Mannequin";
import { PageHead } from "./PageHead";

/** The stylist: used full-page on /stylist and docked beside any page via the sidebar button. */
export function StylistPanel({ compact = false }: { compact?: boolean }) {
  const items = useItems();
  const saveOutfit = useMutation(api.outfits.save);
  const [occasion, setOccasion] = useState<Occasion>("casual");
  const [tempC, setTempC] = useState(20);
  const [weatherNote, setWeatherNote] = useState("");
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [saveError, setSaveError] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);

  const result = useMemo(
    () => (items ? generateSuggestions(items, { occasion, tempC }) : null),
    [items, occasion, tempC],
  );
  if (!items || !result) return <p className="text-muted">Loading…</p>;

  const keyOf = (s: Suggestion) => s.items.map((i) => i._id).join(",");

  function fetchWeather() {
    setWeatherNote("Looking up the weather…");
    if (!navigator.geolocation) return setWeatherNote("Your browser can't share a location. Use the slider.");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`,
          );
          const data = (await res.json()) as { current?: { temperature_2m?: number } };
          const t = data.current?.temperature_2m;
          if (typeof t !== "number") throw new Error("no temperature");
          setTempC(Math.round(t));
          setWeatherNote(`It is ${Math.round(t)}°C where you are right now.`);
        } catch {
          setWeatherNote("Couldn't fetch the weather. Use the slider.");
        }
      },
      () => setWeatherNote("Location was blocked. Use the slider."),
    );
  }

  async function save(s: Suggestion) {
    setSaveError("");
    try {
      const label = OCCASIONS.find((o) => o.id === occasion)?.label ?? "Look";
      await saveOutfit({ name: `${label} look`, occasion: `${label}, ${tempC}°C`, itemIds: s.items.map((i) => i._id) });
      setSavedKeys((k) => [...k, keyOf(s)]);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save");
    }
  }

  async function ask() {
    setAsking(true);
    setAnswer("");
    try {
      const res = await fetch("/api/stylist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          occasion,
          tempC,
          wardrobe: items!.map((i) => ({ name: i.name, category: i.category, colorName: i.colorName, formality: i.formality, season: i.season })),
          suggestions: result!.suggestions.map((s) => s.items.map((i) => i.name)),
        }),
      });
      if (!res.ok || !res.body || (res.headers.get("content-type") ?? "").includes("json")) {
        const data = (await res.json()) as { error?: string };
        setAnswer(data.error ?? "No answer.");
      } else {
        // Show the words as they arrive.
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setAnswer(text);
        }
      }
    } catch {
      setAnswer("Couldn't reach the stylist. Check your connection and try again.");
    }
    setAsking(false);
  }

  return (
    <div className="@container">
      {!compact && (
        <PageHead
          eyebrow="The styling room"
          title="What are you dressing for?"
          sub="Looks are built from pieces you own and scored on formality, season and colour. This part is plain logic: free, instant and private."
        />
      )}

      <div className="card mt-4 grid gap-4 p-4 @xl:grid-cols-[1fr_1fr_auto] @xl:items-end">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Occasion</span>
          <select className="field" value={occasion} onChange={(e) => setOccasion(e.target.value as Occasion)}>
            {OCCASIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Temperature: {tempC}°C</span>
          <input type="range" min={-10} max={40} value={tempC} onChange={(e) => setTempC(Number(e.target.value))} className="w-full" />
        </label>
        <button className="btn btn-ghost" onClick={fetchWeather}>Use my weather</button>
        {weatherNote && <p className="text-xs text-muted @xl:col-span-3">{weatherNote}</p>}
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-muted">Add some clothes first, then come back for suggestions.</p>
      ) : (
        <>
          {result.missing.length > 0 && (
            <p className="mt-4 rounded border border-accent bg-accent/20 p-3 text-sm">
              To get better suggestions, add: {result.missing.join("; ")}.
            </p>
          )}
          {saveError && <p className="mt-3 text-sm text-red-700">{saveError}</p>}
          <ul className="mt-6 grid gap-4 @2xl:grid-cols-3">
            {result.suggestions.map((s, idx) => (
              <li key={keyOf(s)} className="card p-4">
                <div className="checker rounded py-2">
                  <Mannequin items={s.items} className="mx-auto h-64" />
                </div>
                <h2 className="mt-3 font-semibold tracking-tight text-lg">Look {idx + 1}</h2>
                <p className="text-xs text-muted">{s.items.map((i) => i.name).join(" · ")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {s.reasons.map((r) => <li key={r}>{r}</li>)}
                </ul>
                <button className="btn mt-3 w-full" disabled={savedKeys.includes(keyOf(s))} onClick={() => void save(s)}>
                  {savedKeys.includes(keyOf(s)) ? "Saved to Outfits ✓" : "Save this outfit"}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <section className="mt-8 border-t border-line pt-5">
        <h2 className="font-semibold tracking-tight text-lg">Ask the stylist</h2>
        <p className="mt-1 text-sm text-muted">Free AI chat. Try “What shoes go with look 2?”</p>
        <div className="mt-3 flex gap-2">
          <input
            className="field"
            placeholder="Ask anything about your outfits…"
            maxLength={500}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && question.trim() && !asking && void ask()}
          />
          <button className="btn" disabled={!question.trim() || asking} onClick={() => void ask()}>
            {asking ? "…" : "Ask"}
          </button>
        </div>
        {answer && <p className="card mt-4 whitespace-pre-wrap p-4 text-sm">{answer}</p>}
      </section>
    </div>
  );
}
