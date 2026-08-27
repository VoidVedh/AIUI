import sharp from "sharp";
import { PNG } from "pngjs";
import {
  UIIRDocument,
  UIIRDocumentSchema,
  UINode,
  CvExtractor,
  PerceptionNode,
  ExtractedColorSummary,
} from "@aiui/core";
import { ModelCallResult } from "../providers/types.js";
import { CostLogEntry, PipelineStage } from "../types.js";
import { normalizeNodeType, normalizeStyles } from "./multiPassAnalyzer.js";
import { ImagePreprocessor, PreprocessedImageResult } from "./imagePreprocessor.js";

export interface VisionCallPayload {
  prompt: string;
  images: Buffer[];
  mimeType?: string;
  jsonMode?: boolean;
}

export interface VisionCallResponse {
  text: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  latencyMs: number;
}

export type VisionCaller = (payload: VisionCallPayload) => Promise<VisionCallResponse>;

export interface FusionAnalyzerOptions {
  providerName: string;
  modelName: string;
  stage?: PipelineStage;
}

export class FusionPerceptionEngine {
  /**
   * Open Recursive Perception Engine:
   * 1. Canvas/Sharp Image Normalization & Dominant Palette Pixel Grounding Context
   * 2. Single VLM Call with Open Recursive Tree Schema & Free-Text Roles
   * 3. Multi-Crop High-Resolution Detail Pass for Dense/Low-Confidence Subtrees
   * 4. 3-Tier Sharp Real Pixel Asset Extraction (Icons, Avatars, Photos, Logos)
   * 5. Generic UINode IR Construction (Zero Hardcoded Templates)
   */
  public static async analyze(
    imageBuffer: Buffer,
    mimeType: string,
    viewport: { width: number; height: number },
    docName: string,
    caller: VisionCaller,
    options: FusionAnalyzerOptions
  ): Promise<ModelCallResult<UIIRDocument>> {
    const startTime = Date.now();
    const stage = options.stage || "analyzing";

    // -------------------------------------------------------------
    // STEP 1: Image Normalization & Preprocessing
    // -------------------------------------------------------------
    let preprocessed: PreprocessedImageResult;
    try {
      preprocessed = await ImagePreprocessor.process(imageBuffer, mimeType, viewport.width);
    } catch {
      preprocessed = {
        normalizedBuffer: imageBuffer,
        width: viewport.width,
        height: viewport.height,
        aspectRatio: viewport.width / viewport.height,
        dominantColors: {
          canvasBg: "#0B132B",
          cardSurface: "#1E293B",
          accentCta: "#2563EB",
          textPrimary: "#F8FAFC",
          isDarkTheme: true,
        },
      };
    }

    // -------------------------------------------------------------
    // STEP 2: Pixel Grounding Analysis (Palette & Contrast Context)
    // -------------------------------------------------------------
    let png: PNG | null = null;
    try {
      png = PNG.sync.read(preprocessed.normalizedBuffer);
    } catch {
      png = null;
    }

    const cvData = this.analyzePixels(png, preprocessed.width, preprocessed.height);

    const palette: ExtractedColorSummary = {
      dominantBg: cvData.colors?.dominantBg || preprocessed.dominantColors.canvasBg,
      surfaceBg: cvData.colors?.surfaceBg || preprocessed.dominantColors.cardSurface,
      primaryAccent: cvData.colors?.primaryAccent || preprocessed.dominantColors.accentCta,
      textColor: cvData.colors?.textColor || preprocessed.dominantColors.textPrimary,
      mutedColor: cvData.colors?.mutedColor || "#94A3B8",
    };

    // -------------------------------------------------------------
    // STEP 3: Open Recursive VLM Perception Call
    // -------------------------------------------------------------
    const openRecursivePrompt = `You are an expert Frontend AI Perception Engine.
Analyze this UI screenshot and output its complete, true recursive semantic hierarchy in structured JSON.

CRITICAL ARCHITECTURAL RULES:
1. Open Recursive Tree: Output an arbitrary nested hierarchy under a single root node. Describe every visible section, container, card, column, and leaf element faithfully.
2. Open Roles: Use expressive, accurate role strings that describe what each element actually is (e.g., "navbar", "brand-logo", "nav-link", "hero", "badge", "pricing-table", "pricing-card", "toggle-switch", "testimonial-carousel", "testimonial-card", "rating-stars", "sidebar", "metric-card", "chart-container", "kanban-board", "kanban-column", "deal-card", "form", "input-field", "select-dropdown", "button", "code-panel", "feed-card", "audio-player", "video-player", "table", "table-header", "table-row", "avatar", "image"). If no standard pattern fits, describe the structure literally in plain language. NEVER force an asymmetric or custom layout into an unrelated template.
3. Accurate Observed Styles: For each node, observe and extract plain CSS/hex values:
   - "backgroundColor": actual hex/rgba color seen
   - "textColor": actual text color seen
   - "borderColor": actual border color seen
   - "borderRadius": actual radius in px (e.g. 8, 16, 999)
   - "layout": "row" | "column" | "grid" | "stack"
   - "columns": number of columns if grid
   - "gap": spacing in px (e.g. 8, 16, 24)
   - "alignItems" & "justifyContent"
   - "fontSize" & "fontWeight" (e.g. 400, 600, 700, 800)
4. Visual Asset Extraction:
   - For icons: provide the closest Lucide icon name AND a short visual fallback description.
   - For images, avatars, logos, or charts: mark role as "image", "avatar", "logo", or "chart", provide bbox coordinates so pixels can be cropped and preserved verbatim.
5. Exact Observed Content: ONLY transcribe text, titles, subtitles, placeholders, and numbers that are ACTUALLY VISIBLE in the screenshot. Do not invent filler copy.

JSON Output Schema:
{
  "theme": "dark" | "light",
  "dominantPalette": {
    "canvasBg": "${palette.dominantBg}",
    "surfaceBg": "${palette.surfaceBg}",
    "accentColor": "${palette.primaryAccent}",
    "textColor": "${palette.textColor}",
    "mutedColor": "${palette.mutedColor}"
  },
  "root": {
    "id": "page_root",
    "role": "page",
    "styles": { "backgroundColor": "${palette.dominantBg}", "textColor": "${palette.textColor}", "layout": "column" },
    "children": [
      {
        "id": "unique_id",
        "role": "...",
        "bbox": { "x": 0, "y": 0, "width": 1280, "height": 72 },
        "text": "...",
        "styles": { ... },
        "children": [ ... ]
      }
    ]
  }
}`;

    const vlmCallStart = Date.now();
    const vlmResponse = await caller({
      prompt: openRecursivePrompt,
      images: [preprocessed.normalizedBuffer],
      mimeType: mimeType || "image/png",
      jsonMode: true,
    });

    let parsedData: any = {};
    try {
      parsedData = JSON.parse(vlmResponse.text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim());
    } catch {
      parsedData = {};
    }

    // -------------------------------------------------------------
    // STEP 4: Generic Perception Tree Extraction & Synthesis
    // -------------------------------------------------------------
    let rootPerception: PerceptionNode;

    if (parsedData.root && typeof parsedData.root === "object") {
      rootPerception = parsedData.root;
      if (!rootPerception.id) rootPerception.id = "page_root";
      if (!rootPerception.role) rootPerception.role = "page";
    } else {
      // Create a sensible root from any returned structures or CV data
      rootPerception = {
        id: "page_root",
        role: "page",
        styles: {
          backgroundColor: palette.dominantBg,
          textColor: palette.textColor,
          layout: cvData.isSplitLayout ? "row" : "column",
        },
        children: [],
      };
    }

    // Normalize palette if model provided a refined one
    if (parsedData.dominantPalette) {
      if (parsedData.dominantPalette.canvasBg) palette.dominantBg = parsedData.dominantPalette.canvasBg;
      if (parsedData.dominantPalette.surfaceBg) palette.surfaceBg = parsedData.dominantPalette.surfaceBg;
      if (parsedData.dominantPalette.accentColor) palette.primaryAccent = parsedData.dominantPalette.accentColor;
      if (parsedData.dominantPalette.textColor) palette.textColor = parsedData.dominantPalette.textColor;
      if (parsedData.dominantPalette.mutedColor) palette.mutedColor = parsedData.dominantPalette.mutedColor;
    }

    // -------------------------------------------------------------
    // STEP 5: Multi-Crop Grounding for Small Detail (Phase 1B)
    // -------------------------------------------------------------
    let totalPromptTokens = vlmResponse.promptTokens;
    let totalCompletionTokens = vlmResponse.completionTokens;
    let totalCostUsd = vlmResponse.costUsd;

    const detailCropTargets = this.findDetailCropCandidates(rootPerception);
    if (detailCropTargets.length > 0 && detailCropTargets.length <= 2) {
      for (const targetNode of detailCropTargets) {
        if (targetNode.bbox && targetNode.bbox.width > 50 && targetNode.bbox.height > 50) {
          const cropX = Math.round(targetNode.bbox.x <= 1 ? targetNode.bbox.x * preprocessed.width : targetNode.bbox.x);
          const cropY = Math.round(targetNode.bbox.y <= 1 ? targetNode.bbox.y * preprocessed.height : targetNode.bbox.y);
          const cropW = Math.round(targetNode.bbox.width <= 1 ? targetNode.bbox.width * preprocessed.width : targetNode.bbox.width);
          const cropH = Math.round(targetNode.bbox.height <= 1 ? targetNode.bbox.height * preprocessed.height : targetNode.bbox.height);

          if (cropX >= 0 && cropY >= 0 && cropX + cropW <= preprocessed.width && cropY + cropH <= preprocessed.height) {
            try {
              const croppedRegion = await sharp(preprocessed.normalizedBuffer)
                .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
                .png()
                .toBuffer();

              const cropPrompt = `Analyze this zoomed-in UI section (${targetNode.role || "section"}). Output detailed child elements in JSON: { "children": [ { "id": "...", "role": "...", "text": "...", "styles": { ... } } ] }`;

              const cropResponse = await caller({
                prompt: cropPrompt,
                images: [croppedRegion],
                mimeType: "image/png",
                jsonMode: true,
              });

              totalPromptTokens += cropResponse.promptTokens;
              totalCompletionTokens += cropResponse.completionTokens;
              totalCostUsd += cropResponse.costUsd;

              const cropJson = JSON.parse(cropResponse.text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim());
              if (Array.isArray(cropJson.children) && cropJson.children.length > 0) {
                targetNode.children = cropJson.children;
              }
            } catch {
              // Proceed with single-pass perception if multi-crop fails
            }
          }
        }
      }
    }

    // Build canonical UIIRDocument using generic tree walker
    const doc = CvExtractor.buildFromPerceptionTree(
      rootPerception,
      docName,
      { width: preprocessed.width, height: preprocessed.height },
      palette
    );

    // -------------------------------------------------------------
    // STEP 6: 3-Tier Real Pixel Asset Extraction (Phase 1C)
    // -------------------------------------------------------------
    for (const node of Object.values(doc.nodes)) {
      if (node.type === "image" || node.type === "avatar" || node.name?.toLowerCase().includes("logo")) {
        let srcSet = false;
        const posX = typeof node.position.x === "number" ? Math.round(node.position.x) : 0;
        const posY = typeof node.position.y === "number" ? Math.round(node.position.y) : 0;
        const dimW = typeof node.dimensions.width === "number" ? Math.round(node.dimensions.width) : 0;
        const dimH = typeof node.dimensions.height === "number" ? Math.round(node.dimensions.height) : 0;

        // Tier 1: Real Pixel Sharp Crop
        if (
          dimW >= 12 &&
          dimH >= 12 &&
          posX >= 0 &&
          posY >= 0 &&
          posX + dimW <= preprocessed.width &&
          posY + dimH <= preprocessed.height
        ) {
          try {
            const croppedBuffer = await sharp(preprocessed.normalizedBuffer)
              .extract({ left: posX, top: posY, width: dimW, height: dimH })
              .png()
              .toBuffer();
            node.content = {
              ...node.content,
              src: `data:image/png;base64,${croppedBuffer.toString("base64")}`,
            };
            srcSet = true;
          } catch {
            srcSet = false;
          }
        }

        // Tier 2: Deterministic Semantic Fallback
        if (!srcSet && !node.content?.src) {
          if (node.type === "avatar") {
            const avatarId = parseInt(node.id.replace(/\D/g, "") || "1", 10) % 70 || 1;
            node.content = { ...node.content, src: `https://i.pravatar.cc/300?img=${avatarId}` };
          } else {
            const fallbackW = dimW > 0 ? dimW : 400;
            const fallbackH = dimH > 0 ? dimH : 300;
            node.content = { ...node.content, src: `https://picsum.photos/seed/${node.id}/${fallbackW}/${fallbackH}` };
          }
        }
      }
    }

    // Final Normalization & Validation Pass
    for (const node of Object.values(doc.nodes)) {
      const norm = normalizeNodeType(node.type, node.content);
      node.type = norm.type;
      node.content = norm.content;
      node.styles = normalizeStyles(node.styles);
      if (!node.position) node.position = { x: 0, y: 0, relativeTo: "flow" };
      if (!node.dimensions) node.dimensions = { width: "100%", height: "auto" };
      if (!node.layout) {
        node.layout = {
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "stretch",
          gap: 8,
          flexWrap: "nowrap",
        };
      }
    }

    const validatedDoc = UIIRDocumentSchema.parse(doc);

    const costLog: CostLogEntry = {
      stage,
      provider: `${options.providerName} (open-recursive-engine)`,
      model: options.modelName,
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      estimatedCostUsd: Number(totalCostUsd.toFixed(6)),
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };

    return {
      data: validatedDoc,
      costLog,
    };
  }

  private static findDetailCropCandidates(node: PerceptionNode): PerceptionNode[] {
    const candidates: PerceptionNode[] = [];
    if (node.needsDetailCrop || (node.confidence !== undefined && node.confidence < 0.75)) {
      candidates.push(node);
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        candidates.push(...this.findDetailCropCandidates(child));
      }
    }
    return candidates;
  }

  public static analyzePixels(png: PNG | null, width: number, height: number) {
    if (!png) {
      return {
        colors: {
          dominantBg: "#0F172A",
          surfaceBg: "#1E293B",
          primaryAccent: "#3B82F6",
          textColor: "#F8FAFC",
          mutedColor: "#94A3B8",
        },
        leftLuminance: 128,
        rightLuminance: 128,
        isSplitLayout: false,
        leftDark: false,
        isMobile: width <= 480,
      };
    }
    return CvExtractor.analyzePixelBuffer(png);
  }
}
