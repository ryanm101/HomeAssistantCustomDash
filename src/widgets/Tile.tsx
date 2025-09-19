import type { PropsWithChildren, ReactNode } from "react";

export function Tile({
  title,
  subtitle,
  actions,
  children,
}: PropsWithChildren<{ title: string; subtitle?: ReactNode; actions?: ReactNode }>) {
  return (
    <section className="flex h-full flex-col gap-4 rounded-3xl border border-slate-800/70 bg-slate-900/60 p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          {subtitle ? <p className="text-xs uppercase tracking-wider text-slate-400">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex gap-2">{actions}</div> : null}
      </header>
      <div className="flex-1 text-slate-100">{children}</div>
    </section>
  );
}

export function Placeholder({ message }: { message: string }) {
  return <p className="text-sm text-slate-400">{message}</p>;
}
