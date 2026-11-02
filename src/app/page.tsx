import Link from "next/link";
import { ArrowIcon } from "@/components/Icons";
import { DemoStudio } from "@/components/DemoStudio";
import { Mannequin } from "@/components/Mannequin";
import { DEMO_WARDROBE } from "@/lib/garmentArt";

const byName = (n: string) => DEMO_WARDROBE.find((i) => i.name === n)!;
const HERO_LOOK = ["Olive field jacket", "White tee", "Indigo jeans", "White sneakers", "Steel watch"].map(byName);

const STEPS = [
  { n: "01", title: "Photograph", text: "Snap each piece on the floor or bed. The background is removed in your browser and the colour is read for you." },
  { n: "02", title: "Compose", text: "Drop pieces onto the dress form. Swap a shirt, add a watch, and see the whole look at once." },
  { n: "03", title: "Get dressed", text: "Pick an occasion and the temperature. The stylist builds looks from clothes you already own." },
];

const STACK = ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS 4", "Convex", "Clerk", "Groq · Llama (streaming)", "In-browser ML"];

export default function Home() {
  return (
    <div>
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
        <div>
          <p className="label flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-ink" /> A calmer way to get dressed</p>
          <h1 className="display mt-6 text-[clamp(3.4rem,9vw,7.5rem)]">
            Wear
            <br />
            <span className="outline-text">more of</span>
            <br />
            what you own.
          </h1>
          <p className="mt-8 max-w-md text-lg text-muted">
            Photograph your clothes once. Build outfits on a dress form and let a stylist plan around the
            weather and the occasion.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/sign-up" className="btn !px-6 !py-3 !text-base">Start your wardrobe <ArrowIcon /></Link>
            <a href="#demo" className="btn btn-ghost !px-6 !py-3 !text-base">Try the live demo</a>
          </div>
          <p className="label mt-5">Free · no card · no credits</p>
        </div>

        <div className="relative mx-auto h-[540px] w-full max-w-[520px]" aria-hidden>
          <div className="card rise absolute inset-x-[14%] top-0 bottom-0 overflow-hidden shadow-xl" style={{ ["--r" as string]: "-2deg", ["--d" as string]: "0s" }}>
            <div className="checker flex h-full items-center justify-center">
              <Mannequin items={HERO_LOOK} className="h-[94%]" />
            </div>
            <span className="label absolute bottom-3 left-4">Everyday · Look 01</span>
          </div>
          {/* eslint-disable @next/next/no-img-element */}
          <div className="card rise absolute -right-2 top-6 hidden w-44 p-3 shadow-lg sm:block" style={{ ["--r" as string]: "5deg", ["--d" as string]: "0.15s" }}>
            <img src={byName("Olive field jacket").url!} alt="" className="w-full" />
            <p className="label mt-2">01 · An old favourite</p>
          </div>
          <div className="card rise absolute -left-4 bottom-10 hidden w-48 p-3 shadow-lg sm:block" style={{ ["--r" as string]: "-6deg", ["--d" as string]: "0.3s" }}>
            <img src={byName("White sneakers").url!} alt="" className="w-full" />
            <p className="label mt-2">Worn 5× this month</p>
          </div>
          {/* eslint-enable @next/next/no-img-element */}
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16">
        <p className="label">Live demo · no sign-in</p>
        <h2 className="display mt-3 max-w-2xl text-4xl md:text-6xl">Change the weather. Watch the looks change.</h2>
        <p className="mt-4 max-w-xl text-muted">
          This is the same styling engine your wardrobe uses, running on a sample closet. It scores every
          combination on formality, season and colour harmony.
        </p>
        <div className="mt-10"><DemoStudio /></div>
      </section>

      <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16">
        <p className="label">How it works</p>
        <ol className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="bg-surface p-8">
              <span className="label">{s.n}</span>
              <h3 className="display mt-6 text-3xl">{s.title}</h3>
              <p className="mt-3 text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="stack" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16">
        <p className="label">Built with</p>
        <ul className="mt-6 flex flex-wrap gap-2">
          {STACK.map((t) => <li key={t} className="chip !px-4 !py-1.5 text-sm">{t}</li>)}
        </ul>
        <p className="mt-6 max-w-2xl text-sm text-muted">
          Typed end to end. Row-level ownership checks in the backend, tested. Background removal and colour
          detection run on-device, so uploads cost nothing. The AI chat streams from a free Groq key kept server-side.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4">
        <div className="rounded-3xl bg-inverse px-8 py-14 text-on-inverse md:px-16">
          <h2 className="display max-w-2xl text-4xl md:text-6xl">Your closet, finally organised.</h2>
          <Link href="/sign-up" className="btn btn-accent mt-8 !px-6 !py-3 !text-base">Create your wardrobe <ArrowIcon /></Link>
        </div>
      </section>
    </div>
  );
}
