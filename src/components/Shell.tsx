"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { CommandPalette, type Command } from "./CommandPalette";
import { ArrowIcon, CloseIcon, HangerIcon, LayersIcon, LogoMark, MoonIcon, PlusIcon, SearchIcon, SparkIcon, SunIcon } from "./Icons";
import { StylistPanel } from "./StylistPanel";

const NAV = [
  { href: "/wardrobe", label: "Wardrobe", Icon: HangerIcon },
  { href: "/add", label: "Add clothes", Icon: PlusIcon },
  { href: "/outfits", label: "Outfits", Icon: LayersIcon },
  { href: "/stylist", label: "Stylist", Icon: SparkIcon },
];

const isPublic = (p: string) => p === "/" || p.startsWith("/sign-in") || p.startsWith("/sign-up");

function subscribeTheme(cb: () => void) {
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
function useTheme() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light"),
    () => "light",
  );
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("fc-theme", next); } catch { /* private mode: theme just won't persist */ }
  };
  return { theme, toggle };
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
      <LogoMark /> fitcheck<span className="font-normal text-muted">.lite</span>
    </Link>
  );
}

function ThemeButton() {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} className="rounded-full p-2 hover:bg-surface-2">
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function PublicHeader() {
  const { isSignedIn, isLoaded } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Logo />
        <nav className="hidden flex-1 justify-center gap-8 text-sm text-muted md:flex">
          <a href="#demo" className="hover:text-ink">Live demo</a>
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#stack" className="hover:text-ink">Built with</a>
        </nav>
        <span className="flex-1 md:hidden" />
        <ThemeButton />
        {isLoaded &&
          (isSignedIn ? (
            <Link href="/wardrobe" className="btn">Open wardrobe <ArrowIcon /></Link>
          ) : (
            <>
              <SignInButton mode="redirect"><button className="hidden text-sm sm:block">Log in</button></SignInButton>
              <Link href="/sign-up" className="btn">Get started <ArrowIcon /></Link>
            </>
          ))}
      </div>
    </header>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded } = useAuth();
  const { toggle } = useTheme();
  const [panelOpen, setPanelOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (isPublic(pathname)) {
    return (
      <>
        <PublicHeader />
        <main>{children}</main>
        <footer className="mt-24 border-t border-line">
          <div className="tape" aria-hidden />
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
            <span>Built by Kidus Yosef · Next.js 16 · React 19 · Convex · Clerk</span>
            <span className="label">Free · no card · no credits</span>
          </div>
        </footer>
      </>
    );
  }

  const onStylistPage = pathname === "/stylist";
  const showPanel = panelOpen && !onStylistPage;
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const commands: Command[] = [
    { id: "wardrobe", label: "Go to Wardrobe", hint: "G W", run: () => router.push("/wardrobe") },
    { id: "add", label: "Add clothes", hint: "G A", run: () => router.push("/add") },
    { id: "outfits", label: "Go to Outfits", hint: "G O", run: () => router.push("/outfits") },
    { id: "new", label: "Build a new outfit", run: () => router.push("/outfits/new") },
    { id: "stylist", label: "Open the stylist page", run: () => router.push("/stylist") },
    { id: "ask", label: "Ask the stylist (side panel)", run: () => setPanelOpen(true) },
    { id: "theme", label: "Toggle light / dark theme", run: toggle },
  ];

  return (
    <div className="flex min-h-screen">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
            <Logo />
            <nav className="ml-6 hidden flex-1 gap-1 text-sm lg:flex" aria-label="Main">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={active(href) ? "page" : undefined}
                  className={`relative px-3 py-1.5 ${active(href) ? "font-medium text-ink" : "text-muted hover:text-ink"}`}
                >
                  {label}
                  {active(href) && <span className="absolute inset-x-3 -bottom-[13px] h-0.5 bg-accent" />}
                </Link>
              ))}
            </nav>
            <span className="flex-1 lg:hidden" />
            <button onClick={() => setPaletteOpen(true)} className="btn btn-ghost btn-sm hidden md:inline-flex" aria-label="Open command palette">
              <SearchIcon className="h-4 w-4" /> <span className="text-muted">Search</span>
              <kbd className="label rounded border border-line px-1.5">⌘K</kbd>
            </button>
            {!onStylistPage && (
              <button className="btn btn-sm" onClick={() => setPanelOpen((o) => !o)} aria-expanded={panelOpen}>
                <SparkIcon className="h-4 w-4" /> Ask stylist
              </button>
            )}
            <ThemeButton />
            {isLoaded && <UserButton />}
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-8 lg:pb-12">{children}</main>
      </div>

      {showPanel && (
        <aside
          aria-label="Stylist"
          className="fixed inset-0 z-40 overflow-y-auto bg-bg lg:sticky lg:inset-auto lg:top-0 lg:h-screen lg:w-[430px] lg:shrink-0 lg:border-l lg:border-line"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
            <div>
              <p className="label">The styling room</p>
              <h2 className="text-lg font-semibold tracking-tight">Your stylist</h2>
            </div>
            <button onClick={() => setPanelOpen(false)} aria-label="Close stylist" className="rounded-full p-2 hover:bg-surface-2"><CloseIcon /></button>
          </div>
          <div className="p-4"><StylistPanel compact /></div>
        </aside>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-line bg-surface/95 backdrop-blur lg:hidden" aria-label="Main">
        {NAV.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active(href) ? "font-semibold text-ink" : "text-muted"}`}
          >
            <Icon />
            {label}
          </Link>
        ))}
      </nav>
      <CommandPalette open={paletteOpen} commands={commands} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
