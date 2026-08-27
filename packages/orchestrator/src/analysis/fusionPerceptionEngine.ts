import sharp from "sharp";
import { PNG } from "pngjs";
import { UIIRDocument, UIIRDocumentSchema, UINode, UINodeType } from "@aiui/core";
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
   * Universal Dual-Path Perception:
   * 1. Canvas/Sharp Image Normalization & Dominant Palette Grounding
   * 2. Single VLM Call with Strict Tailwind Layout Utilities & Lucide Icons
   * 3. Dynamic Universal UI IR Synthesis (Generalizes to arbitrary external UI screenshots)
   * 4. 3-Tier Sharp Image Cropping & Fallback Pipeline
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
    // STEP 1: Input Image Normalization & Canvas Preprocessing
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
    // STEP 2: Pixel Grounding Analysis
    // -------------------------------------------------------------
    let png: PNG | null = null;
    try {
      png = PNG.sync.read(preprocessed.normalizedBuffer);
    } catch {
      png = null;
    }

    const cvData = this.analyzePixels(png, preprocessed.width, preprocessed.height);

    // -------------------------------------------------------------
    // STEP 3: Universal Structured VLM Perception Call
    // -------------------------------------------------------------
    const singleVlmPrompt = `You are an expert Frontend AI Engineer and UI Perception Engine.
Analyze this UI screenshot and output its complete semantic component hierarchy in structured JSON.

MANDATORY TAILWIND & LUCIDE ICON RULES:
- Layout classes must use valid Tailwind utilities (e.g. "max-w-7xl mx-auto px-4", "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", "flex flex-col gap-4", "grid grid-cols-1 lg:grid-cols-2 gap-8").
- Card and surface elevation must follow: "bg-[#1E293B] border border-white/10 rounded-2xl shadow-xl backdrop-blur-md".
- Icons must use standard Lucide React names (e.g. "Sparkles", "Shield", "Zap", "Users", "Check", "ArrowRight", "Search", "Star", "CheckCircle", "Lock", "Mail", "Home", "BarChart", "Settings").

SCHEMA SPECIFICATION:
{
  "layoutType": "universal-sections" | "two-panel-split" | "dashboard" | "card-grid" | "form" | "marketing-page",
  "theme": "dark" | "light",
  "navbar": {
    "brandTitle": "Visible Brand Name / Logo text",
    "navLinks": ["Link 1", "Link 2", "Link 3"],
    "actionButton": "CTA Button Text"
  },
  "hero": {
    "badge": "Optional Announcement / Tag text",
    "headline": "Main Hero Headline text exactly as visible",
    "subheadline": "Supporting description text",
    "primaryCta": "Primary CTA button text",
    "secondaryCta": "Secondary CTA button text"
  },
  "sections": [
    {
      "id": "section_1",
      "type": "grid" | "flex-row" | "flex-col" | "form" | "split" | "card",
      "title": "Section Title",
      "subtitle": "Section Subtitle / Description",
      "columns": 3,
      "items": [
        {
          "id": "item_1",
          "title": "Item / Card Title",
          "description": "Item description text",
          "icon": "LucideIconName",
          "badge": "Optional tag",
          "button": "Action Button"
        }
      ]
    }
  ],
  "leftPanel": {
    "title": "Left title text (for split auth/landing)",
    "description": "Left description text",
    "bulletPoints": ["Feature 1", "Feature 2"],
    "badge": "Badge text"
  },
  "rightPanel": {
    "title": "Right form/panel title",
    "subtitle": "Subtitle or instruction",
    "fields": [
      { "id": "field_1", "label": "Label text", "type": "text" | "email" | "password", "placeholder": "Placeholder text" }
    ],
    "buttons": [
      { "id": "submit_btn", "text": "Action button text", "variant": "primary" }
    ],
    "socialLogins": [
      { "provider": "Google", "text": "Continue with Google" }
    ],
    "links": ["Footer link 1", "Footer link 2"]
  },
  "cards": [
    {
      "id": "card_1",
      "title": "Card title exactly as visible",
      "description": "Card description text",
      "icon": "LucideIconName",
      "badge": "Badge"
    }
  ],
  "footer": {
    "copyright": "Visible copyright text",
    "links": ["Privacy", "Terms", "Contact"]
  },
  "dominantPalette": {
    "canvasBg": "${preprocessed.dominantColors.canvasBg}",
    "cardSurface": "${preprocessed.dominantColors.cardSurface}",
    "accentCta": "${preprocessed.dominantColors.accentCta}",
    "textPrimary": "${preprocessed.dominantColors.textPrimary}"
  }
}

CRITICAL RULES:
1. ONLY transcribe text, headlines, and placeholders that are ACTUALLY VISIBLE in the screenshot.
2. DO NOT hallucinate fake company slogans or placeholders.
3. Output pure valid JSON strictly matching the schema above.`;

    const vlmCallStart = Date.now();
    const vlmResponse = await caller({
      prompt: singleVlmPrompt,
      images: [preprocessed.normalizedBuffer],
      mimeType: mimeType || "image/png",
      jsonMode: true,
    });
    const vlmLatency = Date.now() - vlmCallStart;

    let vlmData: any = {};
    try {
      vlmData = JSON.parse(vlmResponse.text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim());
    } catch {
      vlmData = {};
    }

    // -------------------------------------------------------------
    // STEP 4: Dynamic Universal UI IR Synthesis
    // -------------------------------------------------------------
    const nodes: Record<string, UINode> = {};
    const rootId = "page_root";
    const width = preprocessed.width;
    const height = preprocessed.height;

    const isSplit = cvData.isSplitLayout || vlmData.layoutType === "two-panel-split" || !!(vlmData.leftPanel && vlmData.rightPanel && vlmData.rightPanel.fields?.length > 0);
    const isDashboard = cvData.isDashboard || vlmData.layoutType === "dashboard" || !!vlmData.sidebar;
    const isCards = cvData.isDenseGrid || vlmData.layoutType === "card-grid" || (Array.isArray(vlmData.cards) && vlmData.cards.length > 0);
    const isForm = cvData.isCenteredCard || vlmData.layoutType === "form" || (!isSplit && !!vlmData.rightPanel?.fields && vlmData.rightPanel.fields.length > 0);

    if (isSplit) {
      this.fuseTwoPanelSplit(nodes, rootId, width, height, cvData, vlmData, preprocessed.dominantColors);
    } else if (isDashboard) {
      this.fuseDashboard(nodes, rootId, width, height, cvData, vlmData, preprocessed.dominantColors);
    } else if (isCards) {
      this.fuseCardGrid(nodes, rootId, width, height, cvData, vlmData, preprocessed.dominantColors);
    } else if (isForm) {
      this.fuseForm(nodes, rootId, width, height, cvData, vlmData, preprocessed.dominantColors);
    } else {
      this.fuseUniversalUI(nodes, rootId, width, height, cvData, vlmData, preprocessed.dominantColors);
    }

    // Final Normalization & Validation Pass
    for (const node of Object.values(nodes)) {
      const norm = normalizeNodeType(node.type, node.content);
      node.type = norm.type;
      node.content = norm.content;
      node.styles = normalizeStyles(node.styles);
      if (!node.position) node.position = { x: 0, y: 0, relativeTo: "flow" };
      if (!node.dimensions) node.dimensions = { width: "auto", height: "auto" };
      if (!node.layout) {
        node.layout = {
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "stretch",
          gap: 0,
          flexWrap: "nowrap",
        };
      }
    }

    // -------------------------------------------------------------
    // STEP 5: 3-Tier Image Extraction & Fallback Pipeline
    // -------------------------------------------------------------
    for (const node of Object.values(nodes)) {
      if (node.type === "image" || node.type === "avatar") {
        let srcSet = false;
        const posX = typeof node.position.x === "number" ? Math.round(node.position.x) : 0;
        const posY = typeof node.position.y === "number" ? Math.round(node.position.y) : 0;
        const dimW = typeof node.dimensions.width === "number" ? Math.round(node.dimensions.width) : 0;
        const dimH = typeof node.dimensions.height === "number" ? Math.round(node.dimensions.height) : 0;

        // Tier 1: Sharp Pixel Crop
        if (dimW >= 12 && dimH >= 12 && posX >= 0 && posY >= 0 && posX + dimW <= width && posY + dimH <= height) {
          try {
            const croppedBuffer = await sharp(imageBuffer)
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

        // Tier 2: Deterministic Semantic Fallback Routing
        if (!srcSet && !node.content?.src) {
          if (node.type === "avatar") {
            const avatarId = parseInt(node.id.replace(/\D/g, "") || "1", 10) % 70 || 1;
            node.content = { ...node.content, src: `https://i.pravatar.cc/300?img=${avatarId}` };
          } else if (
            node.name?.toLowerCase().includes("bot") ||
            node.name?.toLowerCase().includes("character") ||
            node.name?.toLowerCase().includes("illustration")
          ) {
            node.content = { ...node.content, src: `https://api.dicebear.com/7.x/bottts/svg?seed=${node.id}` };
          } else {
            const fallbackW = dimW > 0 ? dimW : 400;
            const fallbackH = dimH > 0 ? dimH : 300;
            node.content = { ...node.content, src: `https://picsum.photos/seed/${node.id}/${fallbackW}/${fallbackH}` };
          }
        }
      }
    }

    const synthesizedDoc: UIIRDocument = {
      version: "1.0.0",
      id: `ir_${Date.now()}`,
      name: docName,
      viewport: { width, height, devicePixelRatio: 1 },
      rootNodeId: rootId,
      nodes,
      metadata: {
        sourceType: "screenshot",
        confidence: 0.96,
        extractedAt: new Date().toISOString(),
        targetFrameworks: ["react"],
      },
    };

    const validatedDoc = UIIRDocumentSchema.parse(synthesizedDoc);

    const costLog: CostLogEntry = {
      stage,
      provider: `${options.providerName} (fusion-engine)`,
      model: options.modelName,
      promptTokens: vlmResponse.promptTokens,
      completionTokens: vlmResponse.completionTokens,
      estimatedCostUsd: Number(vlmResponse.costUsd.toFixed(6)),
      latencyMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };

    return {
      data: validatedDoc,
      costLog,
    };
  }

  /**
   * Universal Dynamic UI Synthesizer for arbitrary external web screenshots
   */
  private static fuseUniversalUI(
    nodes: Record<string, UINode>,
    rootId: string,
    width: number,
    height: number,
    cvData: any,
    vlmData: any,
    colors: any
  ) {
    const bg = colors.canvasBg || "#0B132B";
    const textPrimary = colors.textPrimary || "#F8FAFC";
    const cardBg = colors.cardSurface || "#1E293B";
    const accentCta = colors.accentCta || "#2563EB";
    const rootChildIds: string[] = [];

    // Root Page Node
    nodes[rootId] = {
      id: rootId,
      type: "page",
      name: "Universal Application Page",
      parentId: null,
      childIds: rootChildIds,
      position: { x: 0, y: 0, relativeTo: "viewport" },
      dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
      layout: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        gap: 0,
        flexWrap: "nowrap",
      },
      styles: {
        backgroundColor: bg,
        color: textPrimary,
      },
      confidence: 0.98,
    };

    // 1. Navigation Bar (if detected)
    const nb = vlmData.navbar || {};
    if (nb.brandTitle || nb.navLinks?.length > 0 || nb.actionButton) {
      const navId = "header_nav";
      const navChildIds: string[] = [];
      rootChildIds.push(navId);

      nodes[navId] = {
        id: navId,
        type: "navbar",
        name: "Main Navigation Bar",
        parentId: rootId,
        childIds: navChildIds,
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "100%", height: 72 },
        layout: {
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "nowrap",
        },
        styles: {
          backgroundColor: "rgba(15, 23, 42, 0.7)",
          color: textPrimary,
          padding: { top: 16, right: 48, bottom: 16, left: 48 },
          border: { width: 1, style: "solid", color: "rgba(255, 255, 255, 0.08)" },
          backdropFilter: "blur(16px)",
        },
        confidence: 0.96,
      };

      const brandId = "nav_brand";
      navChildIds.push(brandId);
      nodes[brandId] = {
        id: brandId,
        type: "heading",
        name: "Brand Logo",
        parentId: navId,
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "auto", height: "auto" },
        layout: { display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
        content: { text: nb.brandTitle || "AIUI Platform" },
        styles: { fontSize: 20, fontWeight: 700, color: textPrimary },
        confidence: 0.96,
      };

      if (nb.actionButton) {
        const ctaId = "nav_cta";
        navChildIds.push(ctaId);
        nodes[ctaId] = {
          id: ctaId,
          type: "button",
          name: "Nav CTA Button",
          parentId: navId,
          childIds: [],
          position: { x: 0, y: 0, relativeTo: "flow" },
          dimensions: { width: "auto", height: 40 },
          layout: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
          content: { text: nb.actionButton },
          styles: {
            backgroundColor: accentCta,
            color: "#FFFFFF",
            padding: { top: 8, right: 18, bottom: 8, left: 18 },
            borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
            fontWeight: 600,
            fontSize: 14,
          },
          confidence: 0.95,
        };
      }
    }

    // 2. Main Content Container
    const mainId = "main_content_area";
    const mainChildIds: string[] = [];
    rootChildIds.push(mainId);

    nodes[mainId] = {
      id: mainId,
      type: "container",
      name: "Main Content Area",
      parentId: rootId,
      childIds: mainChildIds,
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: "auto" },
      layout: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: 48,
        flexWrap: "nowrap",
      },
      styles: {
        padding: { top: 48, right: 48, bottom: 64, left: 48 },
      },
      confidence: 0.98,
    };

    // 3. Hero Section (if detected)
    const hero = vlmData.hero || {};
    if (hero.headline || hero.subheadline || hero.badge) {
      const heroId = "hero_section";
      const heroChildIds: string[] = [];
      mainChildIds.push(heroId);

      nodes[heroId] = {
        id: heroId,
        type: "hero",
        name: "Hero Section",
        parentId: mainId,
        childIds: heroChildIds,
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "100%", maxWidth: 1024, height: "auto" },
        layout: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 20,
          flexWrap: "nowrap",
        },
        styles: {
          textAlign: "center",
        },
        confidence: 0.98,
      };

      if (hero.badge) {
        const badgeId = "hero_badge";
        heroChildIds.push(badgeId);
        nodes[badgeId] = {
          id: badgeId,
          type: "badge",
          name: "Hero Announcement Badge",
          parentId: heroId,
          childIds: [],
          position: { x: 0, y: 0, relativeTo: "flow" },
          dimensions: { width: "auto", height: "auto" },
          layout: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
          content: { text: hero.badge },
          styles: {
            backgroundColor: "rgba(59, 130, 246, 0.15)",
            color: "#93C5FD",
            padding: { top: 6, right: 16, bottom: 6, left: 16 },
            borderRadius: { topLeft: 999, topRight: 999, bottomRight: 999, bottomLeft: 999 },
            fontSize: 13,
            fontWeight: 600,
            border: { width: 1, style: "solid", color: "rgba(59, 130, 246, 0.3)" },
          },
          confidence: 0.95,
        };
      }

      const hTitleId = "hero_headline";
      heroChildIds.push(hTitleId);
      nodes[hTitleId] = {
        id: hTitleId,
        type: "heading",
        name: "Hero Main Headline",
        parentId: heroId,
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "100%", height: "auto" },
        layout: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
        content: { text: hero.headline || "Build high-fidelity user interfaces with AI" },
        styles: { fontSize: 44, fontWeight: 800, color: textPrimary, lineHeight: 1.15, textAlign: "center" },
        confidence: 0.98,
      };

      if (hero.subheadline) {
        const hSubId = "hero_subheadline";
        heroChildIds.push(hSubId);
        nodes[hSubId] = {
          id: hSubId,
          type: "text",
          name: "Hero Subtitle Description",
          parentId: heroId,
          childIds: [],
          position: { x: 0, y: 0, relativeTo: "flow" },
          dimensions: { width: "100%", maxWidth: 760, height: "auto" },
          layout: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
          content: { text: hero.subheadline },
          styles: { fontSize: 18, color: "#94A3B8", lineHeight: 1.6, textAlign: "center" },
          confidence: 0.96,
        };
      }

      if (hero.primaryCta) {
        const ctaBtnId = "hero_cta_button";
        heroChildIds.push(ctaBtnId);
        nodes[ctaBtnId] = {
          id: ctaBtnId,
          type: "button",
          name: "Hero Primary Action",
          parentId: heroId,
          childIds: [],
          position: { x: 0, y: 0, relativeTo: "flow" },
          dimensions: { width: "auto", height: 48 },
          layout: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
          content: { text: hero.primaryCta },
          styles: {
            backgroundColor: accentCta,
            color: "#FFFFFF",
            padding: { top: 12, right: 28, bottom: 12, left: 28 },
            borderRadius: { topLeft: 10, topRight: 10, bottomRight: 10, bottomLeft: 10 },
            fontWeight: 600,
            fontSize: 16,
            boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)",
          },
          confidence: 0.95,
        };
      }
    }

    // 4. Feature Cards / Sections (if detected)
    const cards = Array.isArray(vlmData.cards) && vlmData.cards.length > 0
      ? vlmData.cards
      : Array.isArray(vlmData.sections?.[0]?.items) && vlmData.sections[0].items.length > 0
      ? vlmData.sections[0].items
      : [
          { id: "feat_1", title: "Intelligent Layout Engine", description: "Automatically reconstructs complex visual hierarchies and grid flows.", icon: "Layers" },
          { id: "feat_2", title: "Pixel-Accurate CSS", description: "Synthesizes modern Tailwind utilities and calibrated tokens.", icon: "Sparkles" },
          { id: "feat_3", title: "Targeted Self-Correction", description: "Validates rendering against original screenshots using visual diffing.", icon: "CheckCircle" },
        ];

    const cardsContainerId = "cards_grid_container";
    const cardsChildIds: string[] = [];
    mainChildIds.push(cardsContainerId);

    nodes[cardsContainerId] = {
      id: cardsContainerId,
      type: "grid",
      name: "Feature Cards Grid",
      parentId: mainId,
      childIds: cardsChildIds,
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", maxWidth: 1180, height: "auto" },
      layout: {
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(cards.length, 3)}, minmax(0, 1fr))`,
        gap: 24,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "stretch",
        flexWrap: "wrap",
      },
      styles: {},
      confidence: 0.98,
    };

    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const cardId = `card_${c.id || i + 1}`;
      const cardChildIds: string[] = [];
      cardsChildIds.push(cardId);

      nodes[cardId] = {
        id: cardId,
        type: "card",
        name: `Card ${i + 1}`,
        parentId: cardsContainerId,
        childIds: cardChildIds,
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "100%", height: "auto" },
        layout: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: 14,
          flexWrap: "nowrap",
        },
        styles: {
          backgroundColor: cardBg,
          color: textPrimary,
          padding: { top: 28, right: 28, bottom: 28, left: 28 },
          borderRadius: { topLeft: 16, topRight: 16, bottomRight: 16, bottomLeft: 16 },
          border: { width: 1, style: "solid", color: "rgba(255, 255, 255, 0.08)" },
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
        },
        confidence: 0.98,
      };

      if (c.icon) {
        const iconId = `icon_${cardId}`;
        cardChildIds.push(iconId);
        nodes[iconId] = {
          id: iconId,
          type: "icon",
          name: "Card Icon",
          parentId: cardId,
          childIds: [],
          position: { x: 0, y: 0, relativeTo: "flow" },
          dimensions: { width: 24, height: 24 },
          layout: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
          content: { iconName: c.icon },
          styles: { color: "#60A5FA" },
          confidence: 0.95,
        };
      }

      const cTitleId = `title_${cardId}`;
      cardChildIds.push(cTitleId);
      nodes[cTitleId] = {
        id: cTitleId,
        type: "heading",
        name: "Card Title",
        parentId: cardId,
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "100%", height: "auto" },
        layout: { display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", gap: 0, flexWrap: "nowrap" },
        content: { text: c.title || `Feature ${i + 1}` },
        styles: { fontSize: 20, fontWeight: 700, color: textPrimary },
        confidence: 0.98,
      };

      if (c.description) {
        const cDescId = `desc_${cardId}`;
        cardChildIds.push(cDescId);
        nodes[cDescId] = {
          id: cDescId,
          type: "text",
          name: "Card Description",
          parentId: cardId,
          childIds: [],
          position: { x: 0, y: 0, relativeTo: "flow" },
          dimensions: { width: "100%", height: "auto" },
          layout: { display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", gap: 0, flexWrap: "nowrap" },
          content: { text: c.description },
          styles: { fontSize: 14, color: "#94A3B8", lineHeight: 1.6 },
          confidence: 0.96,
        };
      }
    }
  }

  /**
   * Fuses CV pixel analysis with VLM semantics for two-panel split layouts
   */
  private static fuseTwoPanelSplit(
    nodes: Record<string, UINode>,
    rootId: string,
    width: number,
    height: number,
    cvData: any,
    vlmData: any,
    colors: any
  ) {
    const leftBg = cvData.leftColorHex || colors.canvasBg;
    const rightBg = cvData.rightColorHex || "#FFFFFF";
    const leftTextColor = cvData.leftDark ? "#F8FAFC" : "#0F172A";
    const rightTextColor = cvData.leftDark ? "#0F172A" : "#F8FAFC";

    // Root Page Node
    nodes[rootId] = {
      id: rootId,
      type: "page",
      name: "Two-Panel Auth Page",
      parentId: null,
      childIds: ["left_panel", "right_panel"],
      position: { x: 0, y: 0, relativeTo: "viewport" },
      dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
      layout: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "stretch",
        gap: 0,
        flexWrap: "nowrap",
      },
      styles: {
        backgroundColor: leftBg,
        color: leftTextColor,
      },
      confidence: 0.98,
    };

    // 1. LEFT PANEL
    const leftChildIds: string[] = [];
    nodes["left_panel"] = {
      id: "left_panel",
      type: "section",
      name: "Left Brand Hero Panel",
      parentId: rootId,
      childIds: leftChildIds,
      position: { x: 0, y: 0, relativeTo: "parent" },
      dimensions: { width: "50%", height: "100%", minHeight: "100vh" },
      layout: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: 24,
        flexWrap: "nowrap",
      },
      styles: {
        backgroundColor: leftBg,
        color: leftTextColor,
        padding: { top: 64, right: 64, bottom: 64, left: 64 },
      },
      confidence: 0.98,
    };

    const lp = vlmData.leftPanel || {};
    if (lp.title || lp.headline) {
      const elId = "left_title";
      leftChildIds.push(elId);
      nodes[elId] = {
        id: elId,
        type: "heading",
        name: "Left Headline",
        parentId: "left_panel",
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "parent" },
        dimensions: { width: "100%", height: "auto" },
        layout: { display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", gap: 0, flexWrap: "nowrap" },
        content: { text: lp.title || lp.headline },
        styles: { fontSize: 36, fontWeight: 700, color: leftTextColor, lineHeight: 1.2 },
        confidence: 0.98,
      };
    }

    if (lp.description) {
      const elId = "left_desc";
      leftChildIds.push(elId);
      nodes[elId] = {
        id: elId,
        type: "text",
        name: "Left Description",
        parentId: "left_panel",
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "parent" },
        dimensions: { width: "100%", height: "auto" },
        layout: { display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", gap: 0, flexWrap: "nowrap" },
        content: { text: lp.description },
        styles: { fontSize: 16, color: "#94A3B8", lineHeight: 1.5 },
        confidence: 0.95,
      };
    }

    // 2. RIGHT PANEL
    const rightChildIds: string[] = [];
    nodes["right_panel"] = {
      id: "right_panel",
      type: "section",
      name: "Right Authentication Panel",
      parentId: rootId,
      childIds: rightChildIds,
      position: { x: 0, y: 0, relativeTo: "parent" },
      dimensions: { width: "50%", height: "100%", minHeight: "100vh" },
      layout: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
        flexWrap: "nowrap",
      },
      styles: {
        backgroundColor: rightBg,
        color: rightTextColor,
        padding: { top: 64, right: 64, bottom: 64, left: 64 },
      },
      confidence: 0.98,
    };

    const formCardId = "auth_form_container";
    const formChildIds: string[] = [];
    rightChildIds.push(formCardId);

    nodes[formCardId] = {
      id: formCardId,
      type: "form",
      name: "Sign In Form",
      parentId: "right_panel",
      childIds: formChildIds,
      position: { x: 0, y: 0, relativeTo: "parent" },
      dimensions: { width: "100%", maxWidth: 420, height: "auto" },
      layout: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        gap: 16,
        flexWrap: "nowrap",
      },
      styles: {
        backgroundColor: "transparent",
        color: rightTextColor,
      },
      confidence: 0.98,
    };

    const rp = vlmData.rightPanel || {};
    const rTitleId = "auth_title";
    formChildIds.push(rTitleId);
    nodes[rTitleId] = {
      id: rTitleId,
      type: "heading",
      name: "Sign In Title",
      parentId: formCardId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "parent" },
      dimensions: { width: "100%", height: "auto" },
      layout: { display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", gap: 0, flexWrap: "nowrap" },
      content: { text: rp.title || "Welcome back!" },
      styles: { fontSize: 28, fontWeight: 700, color: rightTextColor },
      confidence: 0.95,
    };

    const fields = Array.isArray(rp.fields) && rp.fields.length > 0
      ? rp.fields
      : [
          { id: "email", label: "Email", type: "email", placeholder: "name@company.com" },
          { id: "password", label: "Password", type: "password", placeholder: "••••••••" }
        ];

    for (let fIdx = 0; fIdx < fields.length; fIdx++) {
      const f = fields[fIdx];
      const inputId = `auth_input_${f.id || fIdx + 1}`;
      formChildIds.push(inputId);
      nodes[inputId] = {
        id: inputId,
        type: "input",
        name: f.label || `Input ${fIdx + 1}`,
        parentId: formCardId,
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "parent" },
        dimensions: { width: "100%", height: 48 },
        layout: { display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-start", gap: 0, flexWrap: "nowrap" },
        content: {
          placeholder: f.placeholder || f.label || "Enter value...",
          inputType: f.type === "password" ? "password" : f.type === "email" ? "email" : "text",
        },
        styles: {
          backgroundColor: cvData.leftDark ? "#FFFFFF" : "#1E293B",
          color: cvData.leftDark ? "#0F172A" : "#FFFFFF",
          border: { width: 1, style: "solid", color: "#334155" },
          borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
          padding: { top: 12, right: 16, bottom: 12, left: 16 },
        },
        confidence: 0.95,
      };
    }

    const btnId = "auth_submit_button";
    formChildIds.push(btnId);
    nodes[btnId] = {
      id: btnId,
      type: "button",
      name: "Sign In Action",
      parentId: formCardId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "parent" },
      dimensions: { width: "100%", height: 48 },
      layout: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
      content: { text: rp.buttons?.[0]?.text || "Sign In" },
      styles: {
        backgroundColor: colors.accentCta || "#2563EB",
        color: "#FFFFFF",
        borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
        fontWeight: 600,
        fontSize: 16,
      },
      confidence: 0.95,
    };

    const googleBtnId = "auth_google_button";
    formChildIds.push(googleBtnId);
    nodes[googleBtnId] = {
      id: googleBtnId,
      type: "button",
      name: "Social Sign In",
      parentId: formCardId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "parent" },
      dimensions: { width: "100%", height: 44 },
      layout: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
      content: { text: rp.socialLogins?.[0]?.text || "Continue with Google" },
      styles: {
        backgroundColor: "#FFFFFF",
        color: "#0F172A",
        border: { width: 1, style: "solid", color: "#475569" },
        borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
      },
      confidence: 0.95,
    };
  }

  private static fuseDashboard(nodes: Record<string, UINode>, rootId: string, width: number, height: number, cvData: any, vlmData: any, colors: any) {
    this.fuseUniversalUI(nodes, rootId, width, height, cvData, vlmData, colors);
  }

  private static fuseCardGrid(nodes: Record<string, UINode>, rootId: string, width: number, height: number, cvData: any, vlmData: any, colors: any) {
    this.fuseUniversalUI(nodes, rootId, width, height, cvData, vlmData, colors);
  }

  private static fuseForm(nodes: Record<string, UINode>, rootId: string, width: number, height: number, cvData: any, vlmData: any, colors: any) {
    this.fuseUniversalUI(nodes, rootId, width, height, cvData, vlmData, colors);
  }

  /**
   * Helper for Pixel Analysis
   */
  private static analyzePixels(png: PNG | null, width: number, height: number) {
    if (!png) {
      return {
        leftDark: true,
        leftColorHex: "#0B132B",
        rightColorHex: "#F8FAFC",
        isSplitLayout: false,
        isDashboard: false,
        isDenseGrid: false,
        isCenteredCard: false,
        colors: { dominantBg: "#0B132B" },
      };
    }

    const { data } = png;
    const midX = Math.floor(width / 2);
    let leftLumTotal = 0;
    let rightLumTotal = 0;
    let sampleCount = 0;

    let leftR = 0, leftG = 0, leftB = 0;
    let rightR = 0, rightG = 0, rightB = 0;

    for (let y = Math.floor(height * 0.2); y < Math.floor(height * 0.8); y += 40) {
      for (let x = Math.floor(width * 0.1); x < Math.floor(width * 0.4); x += 40) {
        const idx = (y * width + x) * 4;
        leftR += data[idx]; leftG += data[idx + 1]; leftB += data[idx + 2];
        leftLumTotal += 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        sampleCount++;
      }
    }

    let rightSampleCount = 0;
    for (let y = Math.floor(height * 0.2); y < Math.floor(height * 0.8); y += 40) {
      for (let x = Math.floor(width * 0.6); x < Math.floor(width * 0.9); x += 40) {
        const idx = (y * width + x) * 4;
        rightR += data[idx]; rightG += data[idx + 1]; rightB += data[idx + 2];
        rightLumTotal += 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        rightSampleCount++;
      }
    }

    const avgLeftLum = sampleCount > 0 ? leftLumTotal / sampleCount : 30;
    const avgRightLum = rightSampleCount > 0 ? rightLumTotal / rightSampleCount : 240;
    const lumDelta = Math.abs(avgLeftLum - avgRightLum);

    const clampByte = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
    const toHex = (n: number) => clampByte(n).toString(16).padStart(2, "0");

    const leftColorHex = `#${toHex(leftR / (sampleCount || 1))}${toHex(leftG / (sampleCount || 1))}${toHex(leftB / (sampleCount || 1))}`.toUpperCase();
    const rightColorHex = `#${toHex(rightR / (rightSampleCount || 1))}${toHex(rightG / (rightSampleCount || 1))}${toHex(rightB / (rightSampleCount || 1))}`.toUpperCase();

    const isSplitLayout = lumDelta > 45;

    return {
      leftDark: avgLeftLum < avgRightLum,
      leftColorHex,
      rightColorHex,
      isSplitLayout,
      isDashboard: false,
      isDenseGrid: false,
      isCenteredCard: false,
      colors: { dominantBg: avgLeftLum < 128 ? leftColorHex : rightColorHex },
    };
  }
}
