/**
 * Compress an image File to a base64 string suitable for Claude Vision.
 *
 * Why: typical phone screenshots are 2-4 MB. Base64 encoding inflates that
 * by ~33%, then JSON over HTTP makes the request slow and the upstream API
 * rejects payloads above ~5 MB. Resizing to 1600px max + JPEG re-encode
 * usually drops it to <500 KB without losing readability.
 */
export async function compressImage(
  file: File,
  options: { maxDim?: number; quality?: number } = {}
): Promise<{ base64: string; dataUrl: string; width: number; height: number }> {
  const { maxDim = 1600, quality = 0.85 } = options;

  const dataUrl = await readAsDataURL(file);

  // Skip resizing for non-photo formats where re-encoding could hurt fidelity
  // (e.g. tiny PNG diagrams). If the image is already small, return as-is.
  const img = await loadImage(dataUrl);
  const longest = Math.max(img.width, img.height);
  if (longest <= maxDim && file.size < 800_000) {
    return {
      base64: dataUrl.split(",")[1] ?? "",
      dataUrl,
      width: img.width,
      height: img.height,
    };
  }

  const scale = Math.min(1, maxDim / longest);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(img, 0, 0, w, h);

  const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);
  return {
    base64: jpegDataUrl.split(",")[1] ?? "",
    dataUrl: jpegDataUrl,
    width: w,
    height: h,
  };
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image decode error"));
    img.src = src;
  });
}
