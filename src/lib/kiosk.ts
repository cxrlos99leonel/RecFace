import { useCallback, useEffect, useState } from "react";

/** Mantém a tela ligada enquanto `active` for true (quiosque na portaria). */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) lock.release().catch(() => {});
      } catch {
        // Bateria fraca ou aba em segundo plano: o navegador pode negar. Sem problema.
      }
    };
    // O navegador solta a trava quando a aba some; pega de novo quando ela volta.
    const onVisible = () => {
      if (document.visibilityState === "visible") acquire();
    };
    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, [active]);
}

/** Liga e desliga a tela cheia da página. */
export function useFullscreen() {
  const [isFull, setIsFull] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(!!document.documentElement.requestFullscreen);
    const onChange = () => setIsFull(!!document.fullscreenElement);
    onChange();
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
  }, []);

  return { isFull, supported, toggle };
}
