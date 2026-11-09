import type { ReactNode } from "react";

/** Cabeçalho branco das páginas do painel. */
export function AdminHeader({ subtitle, title, children }: { subtitle?: string; title: string; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-white px-6 py-6 sm:px-7">
      <div>
        {subtitle && <p className="text-sm text-cinza">{subtitle}</p>}
        <h1 className="mt-1 font-display text-[clamp(30px,3.4vw,40px)] font-black leading-none">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </header>
  );
}
