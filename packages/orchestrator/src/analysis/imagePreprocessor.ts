import sharp from "sharp";
import { PNG } from "pngjs";

export interface PreprocessedImageResult {
  normalizedBuffer: Buffer;
  width: number;
  height: number;
  aspectRatio: number;
  dominantColors: {
    canvasBg: string;
    cardSurface: string;
    accentCta: string;
    textPrimary: string;
    isDarkTheme: boolean;
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export class ImagePreprocessor {
  public static readonly CANONICAL_WIDTH = 1280;

  /**
   * Preprocesses and normalizes any arbitrary external screenshot to a canonical desktop resolution
   * and extracts ground-truth dominant color palettes via histogram frequency clustering.
   */
  public static async process(
    inputBuffer: Buffer,
    mimeType = "image/png",
    targetBaseWidth = ImagePreprocessor.CANONICAL_WIDTH
  ): Promise<PreprocessedImageResult> {
    const meta = await sharp(inputBuffer).metadata();
    const origWidth = meta.width || 1280;
    const origHeight = meta.height || 800;
    const aspectRatio = origWidth / origHeight;

    // Proportional height scaling preserving exact aspect ratio
    const normalizedWidth = targetBaseWidth;
    const normalizedHeight = Math.round(targetBaseWidth / aspectRatio);

    // Normalize image resolution with Sharp
    const normalizedBuffer = await sharp(inputBuffer)
      .resize(normalizedWidth, normalizedHeight, {
        fit: "fill",
        withoutEnlargement: false,
      })
      .png({ quality: 100 })
      .toBuffer();

    // Parse raw pixel buffer for histogram frequency analysis
    const png = PNG.sync.read(normalizedBuffer);
    const { width, height, data } = png;

    const colorHistogram = new Map<string, { r: number; g: number; b: number; count: number; lum: number; sat: number }>();
    const saturatedCandidates: Array<{ hex: string; count: number; r: number; g: number; b: number }> = [];

    const step = 4; // Sample every 4th pixel for speed & accuracy
    for (let i = 0; i < data.length; i += step * 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Quantize to buckets of 4 to cluster anti-aliased subpixels
      const qr = Math.min(255, Math.round(r / 4) * 4);
      const qg = Math.min(255, Math.round(g / 4) * 4);
      const qb = Math.min(255, Math.round(b / 4) * 4);
      const hex = rgbToHex(qr, qg, qb);

      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const sat = maxC === 0 ? 0 : (maxC - minC) / maxC;
      const lum = getLuminance(r, g, b);

      const existing = colorHistogram.get(hex);
      if (existing) {
        existing.count++;
      } else {
        colorHistogram.set(hex, { r: qr, g: qg, b: qb, count: 1, lum, sat });
      }

      if (sat > 0.45 && lum > 40 && lum < 220) {
        saturatedCandidates.push({ hex, count: 1, r, g, b });
      }
    }

    const sortedBuckets = Array.from(colorHistogram.values()).sort((a, b) => b.count - a.count);

    // 1. Canvas Background is the dominant background color (highest frequency)
    const primaryBucket = sortedBuckets[0] || { r: 15, g: 23, b: 42, lum: 20 };
    const canvasBg = rgbToHex(primaryBucket.r, primaryBucket.g, primaryBucket.b);
    const isDarkTheme = primaryBucket.lum < 128;

    // 2. Card Surface is the next most common surface with distinct luminance (|Δlum| >= 8)
    let cardSurface = isDarkTheme ? "#1E293B" : "#FFFFFF";
    for (let i = 1; i < Math.min(sortedBuckets.length, 10); i++) {
      const bucket = sortedBuckets[i];
      const lumDelta = Math.abs(bucket.lum - primaryBucket.lum);
      if (lumDelta >= 8 && lumDelta <= 80 && bucket.sat < 0.35) {
        cardSurface = rgbToHex(bucket.r, bucket.g, bucket.b);
        break;
      }
    }

    // 3. Saturated Accent (CTA / Brand Button)
    let accentCta = "#2563EB";
    if (saturatedCandidates.length > 0) {
      const satCounts = new Map<string, { r: number; g: number; b: number; count: number }>();
      for (const s of saturatedCandidates) {
        const qr = Math.min(255, Math.round(s.r / 8) * 8);
        const qg = Math.min(255, Math.round(s.g / 8) * 8);
        const qb = Math.min(255, Math.round(s.b / 8) * 8);
        const hex = rgbToHex(qr, qg, qb);
        const ex = satCounts.get(hex);
        if (ex) ex.count++;
        else satCounts.set(hex, { r: qr, g: qg, b: qb, count: 1 });
      }
      const topSat = Array.from(satCounts.values()).sort((a, b) => b.count - a.count)[0];
      if (topSat && topSat.count > 20) {
        accentCta = rgbToHex(topSat.r, topSat.g, topSat.b);
      }
    }

    const textPrimary = isDarkTheme ? "#F8FAFC" : "#0F172A";

    return {
      normalizedBuffer,
      width: normalizedWidth,
      height: normalizedHeight,
      aspectRatio,
      dominantColors: {
        canvasBg,
        cardSurface,
        accentCta,
        textPrimary,
        isDarkTheme,
      },
    };
  }
}
