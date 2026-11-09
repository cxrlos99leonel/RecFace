import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Logo } from "@/components/brand";

const links = [
  { href: "#como", label: "Como funciona" },
  { href: "#solucoes", label: "Soluções" },
  { href: "#planos", label: "Planos" },
  { href: "#privacidade", label: "Privacidade" },
  { href: "#faq", label: "Dúvidas" },
];

/** Cabeçalho do site institucional (página inicial). */
export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-20 mx-auto max-w-[1240px] rounded-[28px] bg-white px-3 text-tinta py-2.5 shadow-[0_1px_0_rgba(11,16,32,.06)] sm:rounded-full sm:pl-5">
      <div className="flex items-center justify-between gap-3">
        <Logo className="h-6 sm:h-8" />
        <nav aria-label="Principal" className="hidden items-center gap-1 text-[15px] font-medium lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="rounded-full px-3.5 py-2.5 transition-colors hover:bg-nevoa">
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <Link to="/login" className="hidden rounded-full px-4 py-3 text-[15px] font-semibold hover:bg-nevoa sm:inline-flex">
            Entrar
          </Link>
          <Link
            to="/plataforma"
            className="group inline-flex items-center gap-2 rounded-full bg-tinta px-4 py-3 text-[15px] font-semibold text-lima transition-transform hover:-translate-y-0.5 sm:px-5"
          >
            <span className="hidden sm:inline">Acessar plataforma</span>
            <span className="sm:hidden">Plataforma</span>
            <ArrowRight width={16} height={16} className="hidden transition-transform duration-200 group-hover:translate-x-1 sm:block" />
          </Link>
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full hover:bg-nevoa lg:hidden"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Principal (celular)" className="mt-2 grid gap-1 border-t border-nevoa pt-2 text-base font-medium lg:hidden">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-2xl px-4 py-3 hover:bg-nevoa">
              {l.label}
            </a>
          ))}
          <Link to="/login" className="rounded-2xl px-4 py-3 hover:bg-nevoa">
            Área do administrador
          </Link>
        </nav>
      )}
    </header>
  );
}
