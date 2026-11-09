import { Link } from "@tanstack/react-router";
import type { SVGProps } from "react";

/** Ícone da marca: rosto dentro da moldura de leitura. */
export function LogoMark({ className = "", inverted = false }: { className?: string; inverted?: boolean }) {
  return (
    <span
      className={`grid h-9 w-9 place-items-center rounded-[10px] ${inverted ? "bg-lima" : "bg-tinta"} ${className}`}
      aria-hidden="true"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={inverted ? "#0B1020" : "#C6F432"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <path d="M9 9h.01" />
        <path d="M15 9h.01" />
      </svg>
    </span>
  );
}

export function Logo({ inverted = false, className = "" }: { inverted?: boolean; className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`} aria-label="RecFace, página inicial">
      <LogoMark inverted={inverted} />
      <span className="font-display text-[22px] font-black">RecFace</span>
    </Link>
  );
}

export function ArrowRight(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1" {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/** Ilustração de rosto sendo lido (malha de pontos + moldura). */
export function FaceScanArt({ className = "", tone = "#C6F432" }: { className?: string; tone?: string }) {
  return (
    <svg viewBox="0 0 200 240" className={className} role="img" aria-label="Rosto sendo reconhecido">
      <g fill="none" stroke={tone} strokeWidth="5" strokeLinecap="round">
        <path d="M20 50V28a8 8 0 0 1 8-8h22" />
        <path d="M150 20h22a8 8 0 0 1 8 8v22" />
        <path d="M180 190v22a8 8 0 0 1-8 8h-22" />
        <path d="M50 220H28a8 8 0 0 1-8-8v-22" />
      </g>
      <ellipse cx="100" cy="118" rx="54" ry="70" fill="none" stroke="#5B6475" strokeWidth="2" />
      <g fill={tone}>
        {[
          [78, 104, 3], [122, 104, 3], [100, 128, 3], [84, 152, 3], [116, 152, 3], [100, 160, 3],
          [64, 84, 2.5], [136, 84, 2.5], [100, 66, 2.5], [60, 130, 2.5], [140, 130, 2.5],
        ].map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      <path
        d="M78 104 100 128 122 104M100 128 84 152 100 160 116 152 100 128M64 84 78 104M136 84 122 104M100 66 78 104M100 66 122 104M60 130 84 152M140 130 116 152"
        stroke={tone}
        strokeWidth="1"
        opacity=".45"
        fill="none"
      />
    </svg>
  );
}

/** Moldura com os quatro cantos, usada sobre o vídeo da câmera. */
export function ScanFrame({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 240" className="h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
      <g className="rf-corners" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" style={{ transition: "stroke .3s" }}>
        <path d="M20 50V28a8 8 0 0 1 8-8h22" />
        <path d="M150 20h22a8 8 0 0 1 8 8v22" />
        <path d="M180 190v22a8 8 0 0 1-8 8h-22" />
        <path d="M50 220H28a8 8 0 0 1-8-8v-22" />
      </g>
    </svg>
  );
}
