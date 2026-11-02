import type { ReactNode } from "react";

export function PageHead({ eyebrow, title, sub, actions }: { eyebrow: string; title: string; sub?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div>
        <p className="label">{eyebrow}</p>
        <h1 className="display mt-2 text-4xl md:text-6xl">{title}</h1>
        {sub && <p className="mt-3 max-w-xl text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
