import { Link } from "@tanstack/react-router";
import type { SVGProps } from "react";

/**
 * Logo RecFace: símbolo de foco + "recface" em Space Grotesk com o "f" e o
 * último "e" em blocos digitais. Versão clara (Tinta) para fundos claros e
 * escura (símbolo lima, texto Névoa) para fundos escuros.
 */
export function Logo({ inverted = false, className = "h-8" }: { inverted?: boolean; className?: string }) {
  return (
    <Link to="/" className="flex shrink-0 items-center" aria-label="RecFace, página inicial">
      <img
        src={inverted ? "/brand/recface-logo-escuro.svg" : "/brand/recface-logo-claro.svg"}
        alt="RecFace"
        width={176}
        height={30}
        className={`w-auto ${className}`}
      />
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
