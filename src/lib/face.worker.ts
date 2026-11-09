/// <reference lib="webworker" />
/**
 * Worker de reconhecimento facial.
 *
 * Roda o face-api (TensorFlow.js) fora da thread da interface, para que a
 * câmera, as animações e os cliques continuem fluidos durante a leitura.
 * Recebe quadros como ImageBitmap e devolve o vetor de 128 posições.
 */
import * as faceapi from "@vladmandic/face-api";

const ctx = self as unknown as DedicatedWorkerGlobalScope;

// O face-api não reconhece o ambiente de worker sozinho: indicamos as
// classes equivalentes (OffscreenCanvas no lugar de <canvas>).
class NoVideo {}
faceapi.env.setEnv({
  Canvas: OffscreenCanvas as unknown as typeof HTMLCanvasElement,
  CanvasRenderingContext2D: OffscreenCanvasRenderingContext2D as unknown as typeof CanvasRenderingContext2D,
  Image: ImageBitmap as unknown as typeof HTMLImageElement,
  ImageData,
  Video: NoVideo as unknown as typeof HTMLVideoElement,
  createCanvasElement: () => new OffscreenCanvas(1, 1) as unknown as HTMLCanvasElement,
  createImageElement: () => {
    throw new Error("Imagem não suportada no worker");
  },
  createVideoElement: () => {
    throw new Error("Vídeo não suportado no worker");
  },
  fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
  readFile: () => {
    throw new Error("Sistema de arquivos indisponível");
  },
} as unknown as Parameters<typeof faceapi.env.setEnv>[0]);

type Msg = { id: number; type: "init"; modelsUrl: string } | { id: number; type: "detect"; bitmap: ImageBitmap };

let ready: Promise<string> | null = null;

function init(modelsUrl: string): Promise<string> {
  ready ??= (async () => {
    await faceapi.tf.ready();
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(modelsUrl),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelsUrl),
      faceapi.nets.faceRecognitionNet.loadFromUri(modelsUrl),
    ]);
    // Primeira inferência compila os shaders: fazemos agora, não na primeira pessoa da fila.
    const blank = new OffscreenCanvas(150, 150);
    blank.getContext("2d");
    const input = blank as unknown as HTMLCanvasElement;
    await faceapi.nets.ssdMobilenetv1.locateFaces(input);
    await faceapi.nets.faceLandmark68Net.detectLandmarks(input);
    await faceapi.nets.faceRecognitionNet.computeFaceDescriptor(input);
    return faceapi.tf.getBackend();
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

async function detect(bitmap: ImageBitmap): Promise<Float32Array | null> {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
  bitmap.close();
  const result = await faceapi
    .detectSingleFace(canvas as unknown as HTMLCanvasElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return result?.descriptor ?? null;
}

ctx.onmessage = async (ev: MessageEvent<Msg>) => {
  const msg = ev.data;
  try {
    if (msg.type === "init") {
      const backend = await init(msg.modelsUrl);
      ctx.postMessage({ id: msg.id, ok: true, backend });
    } else {
      const descriptor = await detect(msg.bitmap);
      ctx.postMessage({ id: msg.id, ok: true, descriptor }, descriptor ? [descriptor.buffer] : []);
    }
  } catch (e) {
    ctx.postMessage({ id: msg.id, ok: false, error: e instanceof Error ? e.message : String(e) });
  }
};
