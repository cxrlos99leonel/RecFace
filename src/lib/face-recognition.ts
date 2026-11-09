/**
 * Reconhecimento facial no navegador (@vladmandic/face-api).
 *
 *   1. loadModels()       carrega os modelos uma vez
 *   2. detectDescriptor() lê o maior rosto do quadro e devolve 128 números
 *
 * A comparação com os participantes acontece no servidor. O processamento
 * roda num Web Worker; se o navegador não suportar, cai para a thread da página.
 */
const MODELS_URL = "/models";
const INIT_TIMEOUT_MS = 90_000;
const DETECTION_TIMEOUT_MS = 20_000;
/** Largura usada na análise: o detector trabalha em 512 px, então 640 basta e economiza processamento. */
const ANALYSIS_WIDTH = 640;

type Engine = "worker" | "main";
let engine: Engine | null = null;
let loading: Promise<void> | null = null;

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();

function call<T>(message: Record<string, unknown>, transfer: Transferable[], timeoutMs: number, timeoutMsg: string): Promise<T> {
  const id = ++seq;
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      pending.delete(id);
      reject(new Error(timeoutMsg));
    }, timeoutMs);
    pending.set(id, {
      resolve: (v) => {
        window.clearTimeout(timer);
        resolve(v);
      },
      reject: (e) => {
        window.clearTimeout(timer);
        reject(e);
      },
    });
    worker!.postMessage({ ...message, id }, transfer);
  });
}

function startWorker(): Worker {
  const w = new Worker(new URL("./face.worker.ts", import.meta.url), { type: "module", name: "recface-face" });
  w.onmessage = (ev: MessageEvent<{ id: number; ok: boolean; error?: string } & Record<string, unknown>>) => {
    const p = pending.get(ev.data.id);
    if (!p) return;
    pending.delete(ev.data.id);
    if (ev.data.ok) p.resolve(ev.data);
    else p.reject(new Error(ev.data.error || "Falha no reconhecimento facial."));
  };
  w.onerror = (ev) => {
    ev.preventDefault();
    const err = new Error(ev.message || "O worker de reconhecimento parou.");
    pending.forEach((p) => p.reject(err));
    pending.clear();
  };
  return w;
}

function workerSupported(): boolean {
  return typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap !== "undefined";
}

export function loadModels(): Promise<void> {
  if (engine) return Promise.resolve();
  loading ??= (async () => {
    const t0 = performance.now();
    if (workerSupported()) {
      try {
        worker = startWorker();
        const res = await call<{ backend: string }>(
          { type: "init", modelsUrl: new URL(MODELS_URL, location.origin).href },
          [],
          INIT_TIMEOUT_MS,
          "Os modelos de reconhecimento demoraram demais para carregar."
        );
        engine = "worker";
        console.info(`[face] worker pronto (backend: ${res.backend}, ${Math.round(performance.now() - t0)} ms)`);
        return;
      } catch (e) {
        console.warn("[face] worker indisponível, usando a thread da página:", e);
        worker?.terminate();
        worker = null;
      }
    }
    const { loadModelsMain } = await import("./face-main");
    const backend = await loadModelsMain();
    engine = "main";
    console.info(`[face] modelos prontos na página (backend: ${backend}, ${Math.round(performance.now() - t0)} ms)`);
  })().catch((e) => {
    loading = null;
    throw e;
  });
  return loading;
}

function sourceSize(source: HTMLVideoElement | HTMLCanvasElement): [number, number] {
  return source instanceof HTMLVideoElement ? [source.videoWidth, source.videoHeight] : [source.width, source.height];
}

/**
 * Detecta o maior rosto da imagem e retorna o vetor de 128 posições,
 * ou null se não houver rosto. Lança erro se demorar demais.
 */
export async function detectDescriptor(source: HTMLVideoElement | HTMLCanvasElement): Promise<Float32Array | null> {
  if (!engine) return null;
  const timeoutMsg = "A análise do rosto demorou demais. Recarregue a página e tente novamente.";

  if (engine === "worker" && worker) {
    const [w, h] = sourceSize(source);
    if (!w || !h) return null;
    const scale = Math.min(1, ANALYSIS_WIDTH / w);
    const bitmap = await createImageBitmap(source, {
      resizeWidth: Math.round(w * scale),
      resizeHeight: Math.round(h * scale),
      resizeQuality: "medium",
    });
    const res = await call<{ descriptor: Float32Array | null }>({ type: "detect", bitmap }, [bitmap], DETECTION_TIMEOUT_MS, timeoutMsg);
    return res.descriptor;
  }

  const { detectMain } = await import("./face-main");
  let timer: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error(timeoutMsg)), DETECTION_TIMEOUT_MS);
  });
  try {
    return await Promise.race([detectMain(source), timeout]);
  } finally {
    window.clearTimeout(timer);
  }
}
