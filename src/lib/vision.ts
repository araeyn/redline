"use client";

export interface RelightOptions {
  lightX: number;
  lightY: number;
  intensity: number;
}

export interface RegionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayerMetric {
  name: string;
  score: number;
}

export interface LayerAnalysis {
  overlayUrl: string;
  layers: LayerMetric[];
}

export interface ColorSwatch {
  hex: string;
  weight: number;
}

export interface CompositionMetric {
  label: string;
  score: number;
}

export interface CropSuggestion {
  name: string;
  score: number;
  desc: string;
}

export interface StudioAnalysis {
  heatmapUrl: string;
  palette: ColorSwatch[];
  composition: CompositionMetric[];
  crops: CropSuggestion[];
  creativeDNA: {
    contrast: number;
    saturation: number;
    warmth: number;
    symmetry: number;
    balance: number;
    focus: number;
  };
}

export interface ReadabilityPreview {
  label: string;
  url: string;
}

export interface ReadabilityAnalysis {
  silhouetteUrl: string;
  edgeMapUrl: string;
  thumbnails: ReadabilityPreview[];
  metrics: {
    thumbnailRead: number;
    silhouetteClarity: number;
    valueSeparation: number;
    glanceHierarchy: number;
  };
}

const MAX_PROCESS_SIZE = 900;
const RELIGHT_PROCESS_SIZE = 1500;
const IMAGE_CACHE_LIMIT = 18;
const RESULT_CACHE_LIMIT = 24;
const imageCache = new Map<string, Promise<HTMLImageElement>>();
const regionCache = new Map<string, Promise<string>>();
const relightCache = new Map<string, Promise<string>>();
const layerCache = new Map<string, Promise<LayerAnalysis>>();
const studioCache = new Map<string, Promise<StudioAnalysis>>();
const readabilityCache = new Map<string, Promise<ReadabilityAnalysis>>();

function trimCache<T>(cache: Map<string, Promise<T>>, limit: number) {
  while (cache.size > limit) {
    const oldestKey = cache.keys().next().value;
    if (!oldestKey) {
      break;
    }
    cache.delete(oldestKey);
  }
}

function getCachedPromise<T>(cache: Map<string, Promise<T>>, key: string, limit: number, factory: () => Promise<T>) {
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const pending = factory().catch((error) => {
    cache.delete(key);
    throw error;
  });

  cache.set(key, pending);
  trimCache(cache, limit);
  return pending;
}

function roundKey(value: number, precision = 3) {
  return value.toFixed(precision);
}

async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return getCachedPromise(imageCache, src, IMAGE_CACHE_LIMIT, () =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not load image for analysis."));
      img.src = src;
    }),
  );
}

function getWorkingSize(width: number, height: number, maxDimension = MAX_PROCESS_SIZE) {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function drawImageToCanvas(image: HTMLImageElement, maxDimension = MAX_PROCESS_SIZE) {
  const { width, height } = getWorkingSize(image.naturalWidth || image.width, image.naturalHeight || image.height, maxDimension);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    throw new Error("Canvas context unavailable.");
  }

  ctx.drawImage(image, 0, 0, width, height);
  return { canvas, ctx, width, height };
}

export async function extractRegionDataUrl(imageRef: string, region: RegionBounds) {
  const key = `${imageRef}::${roundKey(region.x, 4)}:${roundKey(region.y, 4)}:${roundKey(region.width, 4)}:${roundKey(region.height, 4)}`;
  return getCachedPromise(regionCache, key, RESULT_CACHE_LIMIT, async () => {
    const image = await loadImageElement(imageRef);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const cropX = Math.max(0, Math.round(region.x * sourceWidth));
    const cropY = Math.max(0, Math.round(region.y * sourceHeight));
    const cropWidth = Math.max(24, Math.round(region.width * sourceWidth));
    const cropHeight = Math.max(24, Math.round(region.height * sourceHeight));

    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Crop canvas unavailable.");
    }

    ctx.drawImage(
      image,
      cropX,
      cropY,
      Math.min(cropWidth, sourceWidth - cropX),
      Math.min(cropHeight, sourceHeight - cropY),
      0,
      0,
      cropWidth,
      cropHeight,
    );

    return canvas.toDataURL("image/png");
  });
}

function createLuminanceMap(data: Uint8ClampedArray) {
  const luminance = new Float32Array(data.length / 4);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    luminance[p] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
  }
  return luminance;
}

function boxBlur(source: Float32Array, width: number, height: number, radius: number) {
  if (radius <= 0) {
    return source.slice();
  }

  const horizontal = new Float32Array(source.length);
  const output = new Float32Array(source.length);

  for (let y = 0; y < height; y++) {
    let acc = 0;
    for (let x = -radius; x <= radius; x++) {
      const clampedX = Math.min(width - 1, Math.max(0, x));
      acc += source[y * width + clampedX];
    }
    for (let x = 0; x < width; x++) {
      horizontal[y * width + x] = acc / (radius * 2 + 1);
      const left = Math.max(0, x - radius);
      const right = Math.min(width - 1, x + radius + 1);
      acc += source[y * width + right] - source[y * width + left];
    }
  }

  for (let x = 0; x < width; x++) {
    let acc = 0;
    for (let y = -radius; y <= radius; y++) {
      const clampedY = Math.min(height - 1, Math.max(0, y));
      acc += horizontal[clampedY * width + x];
    }
    for (let y = 0; y < height; y++) {
      output[y * width + x] = acc / (radius * 2 + 1);
      const top = Math.max(0, y - radius);
      const bottom = Math.min(height - 1, y + radius + 1);
      acc += horizontal[bottom * width + x] - horizontal[top * width + x];
    }
  }

  return output;
}

function getGradient(source: Float32Array, width: number, height: number) {
  const gx = new Float32Array(source.length);
  const gy = new Float32Array(source.length);
  const edge = new Float32Array(source.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const left = source[y * width + Math.max(0, x - 1)];
      const right = source[y * width + Math.min(width - 1, x + 1)];
      const top = source[Math.max(0, y - 1) * width + x];
      const bottom = source[Math.min(height - 1, y + 1) * width + x];

      const dx = right - left;
      const dy = bottom - top;
      gx[idx] = dx;
      gy[idx] = dy;
      edge[idx] = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 3.2);
    }
  }

  return { gx, gy, edge };
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;
}

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) {
    return { h: 0, s: 0, l: lightness };
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;

  switch (max) {
    case rn:
      hue = ((gn - bn) / delta) % 6;
      break;
    case gn:
      hue = (bn - rn) / delta + 2;
      break;
    default:
      hue = (rn - gn) / delta + 4;
      break;
  }

  return { h: hue * 60, s: saturation, l: lightness };
}

function makeScaledPreview(sourceCanvas: HTMLCanvasElement, width: number, label: string): ReadabilityPreview {
  const canvas = document.createElement("canvas");
  const aspect = sourceCanvas.height / sourceCanvas.width;
  canvas.width = width;
  canvas.height = Math.max(1, Math.round(width * aspect));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Preview canvas unavailable.");
  }
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
  return {
    label,
    url: canvas.toDataURL("image/png"),
  };
}

export async function generateRelightPass(imageRef: string, options: RelightOptions) {
  const key = `${imageRef}::${roundKey(options.lightX)}:${roundKey(options.lightY)}:${roundKey(options.intensity, 2)}`;
  return getCachedPromise(relightCache, key, RESULT_CACHE_LIMIT, async () => {
    const image = await loadImageElement(imageRef);
    const { canvas, ctx, width, height } = drawImageToCanvas(image, RELIGHT_PROCESS_SIZE);
    const imageData = ctx.getImageData(0, 0, width, height);
    const source = imageData.data;
    const luminance = createLuminanceMap(source);
    const heightMap = boxBlur(luminance, width, height, 2);
    const { gx, gy } = getGradient(heightMap, width, height);

    const output = ctx.createImageData(width, height);
    const target = output.data;

    const lightX = ((options.lightX + 1) * 0.5) * width;
    const lightY = ((options.lightY + 1) * 0.5) * height;
    const intensityBias = clamp01((options.intensity - 0.7) / 2.7);
    const lightZ = Math.min(width, height) * (0.48 + (1 - intensityBias) * 0.22);
    const normalStrength = 3.4 + intensityBias * 2.1;
    const ambient = 0.48 - intensityBias * 0.08;
    const diffuseWeight = 0.42 + intensityBias * 0.34;
    const specularWeight = 0.08 + intensityBias * 0.13;

    for (let i = 0, p = 0; i < source.length; i += 4, p++) {
      const x = p % width;
      const y = Math.floor(p / width);

      const nx = -gx[p] * normalStrength;
      const ny = -gy[p] * normalStrength;
      const nz = 1;
      const nLength = Math.hypot(nx, ny, nz) || 1;
      const nnx = nx / nLength;
      const nny = ny / nLength;
      const nnz = nz / nLength;

      const px = x;
      const py = y;
      const pz = heightMap[p] * 90;
      const lx = lightX - px;
      const ly = lightY - py;
      const lz = lightZ - pz;
      const lLength = Math.hypot(lx, ly, lz) || 1;
      const llx = lx / lLength;
      const lly = ly / lLength;
      const llz = lz / lLength;

      const diffuse = Math.max(0, nnx * llx + nny * lly + nnz * llz);
      const rx = 2 * diffuse * nnx - llx;
      const ry = 2 * diffuse * nny - lly;
      const rz = 2 * diffuse * nnz - llz;
      const specular = Math.pow(Math.max(0, rz), 20 - intensityBias * 6) * specularWeight;
      const falloff = 1 / (1 + lLength * (0.0031 - intensityBias * 0.0006));
      const lightResponse = clamp01(diffuse * (0.92 + falloff * 0.56));
      const shadowMask = Math.pow(1 - lightResponse, 1.18) * (0.3 + intensityBias * 0.28);
      const highlightMask = Math.pow(lightResponse, 1.75) * (0.2 + intensityBias * 0.26);
      const rimMask = Math.pow(Math.max(0, lightResponse - 0.42), 1.18) * (0.1 + intensityBias * 0.18);
      const directionalLift = (lightResponse - 0.42) * (0.38 + intensityBias * 0.26);
      const shade = ambient + diffuse * diffuseWeight + directionalLift - shadowMask * (0.24 + intensityBias * 0.14) + highlightMask * (0.14 + intensityBias * 0.12) + specular;

      const warmth = clamp01(highlightMask * (1.02 + intensityBias * 0.48) + rimMask * 0.72 + specular * 1.7);
      const coolness = clamp01(shadowMask * (0.74 + intensityBias * 0.24) + (1 - falloff) * 0.14);
      const tonalPunch = 1 + intensityBias * 0.1;
      const deepShadow = 12 + intensityBias * 16;
      const highlightBoost = 18 + intensityBias * 24;
      const detailLift = (luminance[p] - heightMap[p]) * (20 + intensityBias * 14);

      const r = source[i];
      const g = source[i + 1];
      const b = source[i + 2];

      target[i] = Math.min(255, Math.max(0, r * (shade * tonalPunch + warmth * 0.1 - coolness * 0.14) + highlightBoost * warmth - deepShadow * coolness + detailLift * 24));
      target[i + 1] = Math.min(255, Math.max(0, g * (shade * tonalPunch + warmth * 0.05 - coolness * 0.08) + highlightBoost * 0.48 * warmth - deepShadow * 0.42 * coolness + detailLift * 18));
      target[i + 2] = Math.min(255, Math.max(0, b * (shade * tonalPunch - warmth * 0.05 + coolness * 0.1) + highlightBoost * 0.16 * warmth + deepShadow * 0.92 * coolness + detailLift * 12));
      target[i + 3] = source[i + 3];
    }

    ctx.putImageData(output, 0, 0);
    return canvas.toDataURL("image/png");
  });
}

export async function generateLayerAnalysis(imageRef: string): Promise<LayerAnalysis> {
  return getCachedPromise(layerCache, imageRef, RESULT_CACHE_LIMIT, async () => {
    const image = await loadImageElement(imageRef);
    const { canvas, ctx, width, height } = drawImageToCanvas(image);
    const imageData = ctx.getImageData(0, 0, width, height);
    const source = imageData.data;
    const luminance = createLuminanceMap(source);
    const smooth = boxBlur(luminance, width, height, 6);
    const { edge } = getGradient(smooth, width, height);

    const overlay = ctx.createImageData(width, height);
    const target = overlay.data;

    let shadowPixels = 0;
    let midPixels = 0;
    let highlightPixels = 0;
    let edgeEnergy = 0;
    let focusEnergy = 0;

    for (let i = 0, p = 0; i < target.length; i += 4, p++) {
      const lum = smooth[p];
      const edgeStrength = edge[p];
      edgeEnergy += edgeStrength;

      const x = p % width;
      const y = Math.floor(p / width);
      const centerWeight = 1 - Math.min(1, Math.hypot(x - width / 2, y - height / 2) / (Math.min(width, height) * 0.75));
      focusEnergy += edgeStrength * centerWeight;

      let color: [number, number, number, number];
      if (lum < 0.34) {
        shadowPixels++;
        color = [86, 40, 22, 120];
      } else if (lum < 0.68) {
        midPixels++;
        color = [194, 116, 63, 88];
      } else {
        highlightPixels++;
        color = [245, 218, 173, 74];
      }

      if (edgeStrength > 0.16) {
        color = [155, 32, 24, 175];
      }

      target[i] = color[0];
      target[i + 1] = color[1];
      target[i + 2] = color[2];
      target[i + 3] = color[3];
    }

    ctx.putImageData(overlay, 0, 0);

    const totalPixels = width * height || 1;
    const layers: LayerMetric[] = [
      { name: "Shadow Mass", score: shadowPixels / totalPixels },
      { name: "Midtone Structure", score: midPixels / totalPixels },
      { name: "Highlight Planes", score: highlightPixels / totalPixels },
      { name: "Edge Complexity", score: Math.min(1, edgeEnergy / totalPixels / 0.24) },
      { name: "Focal Cohesion", score: Math.min(1, focusEnergy / totalPixels / 0.12) },
    ];

    return {
      overlayUrl: canvas.toDataURL("image/png"),
      layers,
    };
  });
}

export async function generateStudioAnalysis(imageRef: string): Promise<StudioAnalysis> {
  return getCachedPromise(studioCache, imageRef, RESULT_CACHE_LIMIT, async () => {
    const image = await loadImageElement(imageRef);
    const { canvas, ctx, width, height } = drawImageToCanvas(image);
    const imageData = ctx.getImageData(0, 0, width, height);
    const source = imageData.data;
    const luminance = createLuminanceMap(source);
    const smooth = boxBlur(luminance, width, height, 5);
    const { edge } = getGradient(smooth, width, height);
    const heatmap = ctx.createImageData(width, height);
    const heatmapData = heatmap.data;

    const thirdsTargets = [
      { x: width * 0.33, y: height * 0.33 },
      { x: width * 0.67, y: height * 0.33 },
      { x: width * 0.33, y: height * 0.67 },
      { x: width * 0.67, y: height * 0.67 },
    ];

    const paletteBins = new Map<string, { count: number; r: number; g: number; b: number }>();
    let totalSat = 0;
    let totalWarmth = 0;
    let lumSum = 0;
    let lumSqSum = 0;
    let totalEnergy = 0;
    let leftEnergy = 0;
    let rightEnergy = 0;
    let topEnergy = 0;
    let bottomEnergy = 0;
    let thirdsEnergy = 0;
    let centerEnergy = 0;
    let mirrorAgreement = 0;
    let focusX = 0;
    let focusY = 0;

    for (let i = 0, p = 0; i < source.length; i += 4, p++) {
      const x = p % width;
      const y = Math.floor(p / width);
      const lum = smooth[p];
      const edgeStrength = edge[p];
      const r = source[i];
      const g = source[i + 1];
      const b = source[i + 2];
      const { s } = rgbToHsl(r, g, b);

      totalSat += s;
      totalWarmth += (r - b) / 255;
      lumSum += lum;
      lumSqSum += lum * lum;
      totalEnergy += edgeStrength;
      focusX += x * edgeStrength;
      focusY += y * edgeStrength;

      if (x < width / 2) {
        leftEnergy += edgeStrength;
      } else {
        rightEnergy += edgeStrength;
      }

      if (y < height / 2) {
        topEnergy += edgeStrength;
      } else {
        bottomEnergy += edgeStrength;
      }

      const centerDistance = Math.hypot(x - width / 2, y - height / 2) / (Math.min(width, height) * 0.75);
      centerEnergy += edgeStrength * (1 - Math.min(1, centerDistance));

      const thirdDistance = Math.min(
        ...thirdsTargets.map((target) => Math.hypot(x - target.x, y - target.y) / Math.min(width, height)),
      );
      thirdsEnergy += edgeStrength * (1 - Math.min(1, thirdDistance / 0.35));

      const bucketKey = `${Math.floor(r / 32)}-${Math.floor(g / 32)}-${Math.floor(b / 32)}`;
      const bucket = paletteBins.get(bucketKey) ?? { count: 0, r: 0, g: 0, b: 0 };
      bucket.count += 1;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      paletteBins.set(bucketKey, bucket);

      const mirrorX = width - 1 - x;
      const mirrorIndex = y * width + mirrorX;
      mirrorAgreement += 1 - Math.min(1, Math.abs(lum - smooth[mirrorIndex]) * 2.5);

      const thermal = clamp01((r - b + 128) / 255);
      const heat = clamp01(edgeStrength * 1.35 + (1 - centerDistance) * 0.28 + (1 - thirdDistance / 0.35) * 0.2);
      heatmapData[i] = Math.round(255 * heat);
      heatmapData[i + 1] = Math.round(155 * heat + 40 * thermal);
      heatmapData[i + 2] = Math.round(50 * (1 - heat));
      heatmapData[i + 3] = Math.round(180 * heat);
    }

    ctx.putImageData(heatmap, 0, 0);

    const totalPixels = width * height || 1;
    const avgLum = lumSum / totalPixels;
    const lumVariance = Math.max(0, lumSqSum / totalPixels - avgLum * avgLum);
    const contrast = clamp01(Math.sqrt(lumVariance) / 0.32);
    const saturation = clamp01(totalSat / totalPixels / 0.48);
    const warmth = clamp01((totalWarmth / totalPixels + 0.35) / 0.7);
    const symmetry = clamp01(mirrorAgreement / totalPixels);
    const balance = 1 - Math.min(1, Math.abs(leftEnergy - rightEnergy) / Math.max(totalEnergy, 1));
    const verticalBalance = 1 - Math.min(1, Math.abs(topEnergy - bottomEnergy) / Math.max(totalEnergy, 1));
    const focus = clamp01(thirdsEnergy / Math.max(totalEnergy, 0.0001) / 0.52);
    const centerBias = clamp01(centerEnergy / Math.max(totalEnergy, 0.0001) / 0.55);

    const palette = Array.from(paletteBins.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((bucket) => ({
        hex: rgbToHex(bucket.r / bucket.count, bucket.g / bucket.count, bucket.b / bucket.count),
        weight: bucket.count / totalPixels,
      }));

    const focusPointX = focusX / Math.max(totalEnergy, 1);
    const focusPointY = focusY / Math.max(totalEnergy, 1);
    const focusOffsetX = Math.abs(focusPointX / width - 0.5);
    const focusOffsetY = Math.abs(focusPointY / height - 0.5);

    const composition: CompositionMetric[] = [
      { label: "Visual Hierarchy", score: clamp01(focus * 0.55 + contrast * 0.45) },
      { label: "Spatial Balance", score: clamp01(balance * 0.6 + verticalBalance * 0.4) },
      { label: "Edge Rhythm", score: clamp01(totalEnergy / totalPixels / 0.18) },
      { label: "Thirds Alignment", score: focus },
      { label: "Center Bias", score: 1 - Math.min(1, centerBias) },
      { label: "Symmetry Signal", score: symmetry },
    ];

    const crops: CropSuggestion[] = [
      {
        name: "Cinematic Crop",
        score: clamp01(contrast * 0.35 + focus * 0.4 + (1 - focusOffsetY) * 0.25),
        desc: "Wide framing to reinforce hierarchy and directional flow.",
      },
      {
        name: "Detail Punch-In",
        score: clamp01((1 - focusOffsetX) * 0.2 + contrast * 0.25 + (totalEnergy / totalPixels / 0.18) * 0.55),
        desc: "Tighter crop around the densest read to sharpen the idea.",
      },
      {
        name: "Poster Balance",
        score: clamp01(balance * 0.35 + verticalBalance * 0.25 + symmetry * 0.2 + focus * 0.2),
        desc: "Centered poster-style framing for a more iconic silhouette.",
      },
    ];

    return {
      heatmapUrl: canvas.toDataURL("image/png"),
      palette,
      composition,
      crops,
      creativeDNA: {
        contrast,
        saturation,
        warmth,
        symmetry,
        balance,
        focus,
      },
    };
  });
}

export async function generateReadabilityAnalysis(imageRef: string): Promise<ReadabilityAnalysis> {
  return getCachedPromise(readabilityCache, imageRef, RESULT_CACHE_LIMIT, async () => {
    const image = await loadImageElement(imageRef);
    const { canvas, ctx, width, height } = drawImageToCanvas(image);
    const originalCanvas = document.createElement("canvas");
    originalCanvas.width = width;
    originalCanvas.height = height;
    const originalCtx = originalCanvas.getContext("2d");
    if (!originalCtx) {
      throw new Error("Original preview canvas unavailable.");
    }
    originalCtx.drawImage(canvas, 0, 0);
    const imageData = ctx.getImageData(0, 0, width, height);
    const source = imageData.data;
    const luminance = createLuminanceMap(source);
    const smooth = boxBlur(luminance, width, height, 7);
    const { edge } = getGradient(smooth, width, height);

    const silhouette = ctx.createImageData(width, height);
    const silhouetteData = silhouette.data;
    const edgeMap = ctx.createImageData(width, height);
    const edgeData = edgeMap.data;

    let lumSum = 0;
    let lumSqSum = 0;
    let edgeEnergy = 0;
    let topEnergy = 0;
    let centerEnergy = 0;
    let foregroundPixels = 0;
    let backgroundPixels = 0;
    let threshold = 0;

    for (let i = 0; i < smooth.length; i++) {
      threshold += smooth[i];
    }
    threshold /= Math.max(smooth.length, 1);

    for (let i = 0, p = 0; i < source.length; i += 4, p++) {
      const lum = smooth[p];
      const edgeStrength = edge[p];
      const x = p % width;
      const y = Math.floor(p / width);

      lumSum += lum;
      lumSqSum += lum * lum;
      edgeEnergy += edgeStrength;

      const centerDistance = Math.hypot(x - width / 2, y - height / 2) / (Math.min(width, height) * 0.78);
      centerEnergy += edgeStrength * (1 - Math.min(1, centerDistance));

      if (y < height * 0.45) {
        topEnergy += edgeStrength;
      }

      const isForeground = lum < threshold;
      if (isForeground) {
        foregroundPixels++;
      } else {
        backgroundPixels++;
      }

      const value = isForeground ? 36 : 242;
      silhouetteData[i] = value;
      silhouetteData[i + 1] = value;
      silhouetteData[i + 2] = value;
      silhouetteData[i + 3] = 255;

      const edgeValue = Math.round(255 * clamp01(edgeStrength * 2.4));
      edgeData[i] = 255;
      edgeData[i + 1] = 245 - Math.round(edgeValue * 0.35);
      edgeData[i + 2] = 220 - Math.round(edgeValue * 0.7);
      edgeData[i + 3] = Math.round(edgeValue * 0.88);
    }

    ctx.putImageData(silhouette, 0, 0);
    const silhouetteUrl = canvas.toDataURL("image/png");
    ctx.putImageData(edgeMap, 0, 0);
    const edgeMapUrl = canvas.toDataURL("image/png");

    const totalPixels = width * height || 1;
    const avgLum = lumSum / totalPixels;
    const lumVariance = Math.max(0, lumSqSum / totalPixels - avgLum * avgLum);
    const valueSeparation = clamp01(Math.sqrt(lumVariance) / 0.28);
    const energyDensity = clamp01(edgeEnergy / totalPixels / 0.16);
    const glanceHierarchy = clamp01(centerEnergy / Math.max(edgeEnergy, 0.0001) / 0.62);
    const silhouetteBalance = 1 - Math.min(1, Math.abs(foregroundPixels - backgroundPixels) / Math.max(totalPixels * 0.85, 1));
    const silhouetteClarity = clamp01(silhouetteBalance * 0.4 + energyDensity * 0.3 + valueSeparation * 0.3);
    const topWeightBias = clamp01(topEnergy / Math.max(edgeEnergy, 0.0001) / 0.55);
    const thumbnailRead = clamp01(valueSeparation * 0.35 + glanceHierarchy * 0.4 + silhouetteClarity * 0.15 + topWeightBias * 0.1);

    const thumbnails = [
      makeScaledPreview(originalCanvas, 220, "Board View"),
      makeScaledPreview(originalCanvas, 110, "Thumbnail"),
      makeScaledPreview(originalCanvas, 56, "Glance Test"),
    ];

    return {
      silhouetteUrl,
      edgeMapUrl,
      thumbnails,
      metrics: {
        thumbnailRead,
        silhouetteClarity,
        valueSeparation,
        glanceHierarchy,
      },
    };
  });
}
