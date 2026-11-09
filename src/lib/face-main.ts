/**
 * Plano B: reconhecimento na própria thread da página.
 * Usado só quando o navegador não consegue rodar o worker (navegadores antigos).
 */
const MODELS_URL = "/models";

type FaceAPI = typeof import("@vladmandic/face-api");
let fapi: FaceAPI | null = null;
let loading: Promise<string> | null = null;

async function getFaceAPI(): Promise<FaceAPI> {
  fapi ??= await import("@vladmandic/face-api");
  return fapi;
}

export function loadModelsMain(): Promise<string> {
  loading ??= (async () => {
    const api = await getFaceAPI();
    await Promise.all([
      api.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
      api.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
      api.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
    ]);
    const canvas = document.createElement("canvas");
    canvas.width = 150;
    canvas.height = 150;
    await api.nets.ssdMobilenetv1.locateFaces(canvas);
    await api.nets.faceLandmark68Net.detectLandmarks(canvas);
    await api.nets.faceRecognitionNet.computeFaceDescriptor(canvas);
    return (api.tf as unknown as { getBackend: () => string }).getBackend();
  })().catch((e) => {
    loading = null;
    throw e;
  });
  return loading;
}

export async function detectMain(source: HTMLVideoElement | HTMLCanvasElement): Promise<Float32Array | null> {
  const api = await getFaceAPI();
  const result = await api
    .detectSingleFace(source, new api.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return result?.descriptor ?? null;
}
