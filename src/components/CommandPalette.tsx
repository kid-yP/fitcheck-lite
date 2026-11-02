"use client";

import { useState } from "react";
import { SearchIcon } from "./Icons";

export type Command = { id: string; label: string; hint?: string; run: () => void };

function Palette({ commands, onClose }: { commands: Command[]; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const shown = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));
  const current = Math.min(index, Math.max(shown.length - 1, 0));

  function run(cmd?: Command) {
    if (!cmd) return;
    onClose();
    cmd.run();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 p-4 pt-[15vh]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="card w-full max-w-lg overflow-hidden shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <SearchIcon className="text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              else if (e.key === "ArrowDown") { e.preventDefault(); setIndex(Math.min(current + 1, shown.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setIndex(Math.max(current - 1, 0)); }
              else if (e.key === "Enter") run(shown[current]);
            }}
            placeholder="Type a command…"
            aria-label="Search commands"
            className="w-full bg-transparent py-4 text-sm outline-none placeholder:text-muted"
          />
          <kbd className="label rounded border border-line px-1.5 py-0.5">esc</kbd>
        </div>
        <ul role="listbox" className="max-h-72 overflow-y-auto p-2">
          {shown.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === current}>
              <button
                onMouseEnter={() => setIndex(i)}
                onClick={() => run(c)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${i === current ? "bg-surface-2" : ""}`}
              >
                {c.label}
                {c.hint && <span className="label">{c.hint}</span>}
              </button>
            </li>
          ))}
          {shown.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">Nothing matches “{query}”.</li>}
        </ul>
      </div>
    </div>
  );
}

export function CommandPalette({ open, commands, onClose }: { open: boolean; commands: Command[]; onClose: () => void }) {
  return open ? <Palette commands={commands} onClose={onClose} /> : null;
}
