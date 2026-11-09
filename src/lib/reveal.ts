import { useEffect } from "react";

/**
 * Revela com um leve fade + subida os elementos marcados com `data-reveal`
 * quando eles entram na tela. Elementos já visíveis na carga não são tocados
 * (sem "piscar"), e com `prefers-reduced-motion` nada é animado.
 * Irmãos marcados entram em sequência, com 70 ms de intervalo.
 */
export function useScrollReveal() {
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const vh = window.innerHeight;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          io.unobserve(el);
          el.classList.remove("rf-pending");
          // Depois da animação, devolve o controle de transição ao próprio elemento (ex.: hover).
          window.setTimeout(() => {
            el.classList.remove("rf-reveal");
            el.style.removeProperty("--rf-delay");
          }, 1100);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    for (const el of els) {
      if (el.getBoundingClientRect().top < vh * 0.92) continue;
      const siblings = el.parentElement
        ? Array.from(el.parentElement.children).filter((c) => c.hasAttribute("data-reveal"))
        : [el];
      const delay = Math.min(siblings.indexOf(el), 4) * 70;
      el.style.setProperty("--rf-delay", `${delay}ms`);
      el.classList.add("rf-reveal", "rf-pending");
      io.observe(el);
    }
    return () => io.disconnect();
  }, []);
}
