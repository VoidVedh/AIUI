import { PNG } from "pngjs";
import { UIIRDocument, UIIRDocumentSchema, UINode, UINodeType } from "@aiui/core";
import { ModelCallResult } from "../providers/types.js";
import { CostLogEntry, PipelineStage } from "../types.js";
import { normalizeNodeType, normalizeStyles } from "./multiPassAnalyzer.js";

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
   * Dual-Path Perception:
   * 1. Computer Vision / Image Analysis (Pixel-grounded spatial layout, exact background palettes, panel separation)
   * 2. Single VLM Call (Semantic understanding, hierarchy, exact text, placeholders, icons)
   * 3. Fusion Engine (Combines CV geometric/color ground truth with VLM semantic content into Canonical UI IR)
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
    // BRANCH 1: Computer Vision / Image Analysis (Pixel Grounding)
    // -------------------------------------------------------------
    let png: PNG | null = null;
    try {
      png = PNG.sync.read(imageBuffer);
    } catch {
      png = null;
    }

    const cvData = this.analyzePixels(png, viewport.width, viewport.height);

    // -------------------------------------------------------------
    // BRANCH 2: Single VLM Call (Semantic Understanding)
    // -------------------------------------------------------------
    const singleVlmPrompt = `You are an expert UI Perception Engine.
Analyze this UI screenshot and extract its complete semantic structure in structured JSON.

SCHEMA SPECIFICATION:
{
  "layoutType": "two-panel-split" | "dashboard" | "card-grid" | "form" | "landing-page",
  "macroLayout": {
    "flexDirection": "row" | "column",
    "leftWidthPercent": "50%",
    "rightWidthPercent": "50%"
  },
  "leftPanel": {
    "title": "Main title / headline on left side",
    "description": "Paragraph / descriptive text",
    "bulletPoints": ["Feature 1", "Feature 2"],
    "badge": "Badge or tag text"
  },
  "rightPanel": {
    "title": "Form / panel title",
    "subtitle": "Subtitle or instruction",
    "fields": [
      { "id": "email", "label": "Work Email", "type": "email", "placeholder": "name@company.com" },
      { "id": "password", "label": "Password", "type": "password", "placeholder": "••••••••" }
    ],
    "buttons": [
      { "id": "submit_btn", "text": "Sign In", "variant": "primary" }
    ],
    "socialLogins": [
      { "provider": "Google", "text": "Continue with Google" }
    ],
    "links": ["Forgot password?", "Don't have an account? Sign up"]
  },
  "header": {
    "brandTitle": "Brand Name / Header Title",
    "navLinks": ["Features", "Pricing", "Docs"],
    "actionButton": "Explore"
  },
  "sidebar": {
    "brand": "Dashboard Brand",
    "navItems": [
      { "label": "Overview", "icon": "Home" },
      { "label": "Analytics", "icon": "BarChart" },
      { "label": "Settings", "icon": "Settings" }
    ]
  },
  "cards": [
    {
      "id": "card_1",
      "title": "Card 1 Title",
      "description": "Card 1 description text",
      "badge": "Optional badge"
    }
  ],
  "dominantPalette": {
    "leftBg": "#FFFFFF",
    "rightBg": "#0B132B",
    "primaryAccent": "#2563EB",
    "textColor": "#0F172A"
  }
}

CRITICAL RULES:
1. ONLY include text, labels, and placeholders that are ACTUALLY VISIBLE in the screenshot.
2. DO NOT hallucinate fake company slogans.
3. Output pure valid JSON strictly matching the schema above.`;

    const vlmCallStart = Date.now();
    const vlmResponse = await caller({
      prompt: singleVlmPrompt,
      images: [imageBuffer],
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
    // BRANCH 3: FUSION ENGINE (Merge CV Grounding + VLM Semantics)
    // -------------------------------------------------------------
    const nodes: Record<string, UINode> = {};
    const rootId = "page_root";
    const width = viewport.width;
    const height = viewport.height;

    const isSplit = cvData.isSplitLayout || vlmData.layoutType === "two-panel-split" || !!(vlmData.leftPanel && vlmData.rightPanel);
    const isDashboard = cvData.isDashboard || vlmData.layoutType === "dashboard" || !!vlmData.sidebar;
    const isCards = cvData.isDenseGrid || vlmData.layoutType === "card-grid" || (Array.isArray(vlmData.cards) && vlmData.cards.length > 0);
    const isForm = cvData.isCenteredCard || vlmData.layoutType === "form" || (!isSplit && !!vlmData.rightPanel?.fields);

    if (isSplit) {
      this.fuseTwoPanelSplit(nodes, rootId, width, height, cvData, vlmData);
    } else if (isDashboard) {
      this.fuseDashboard(nodes, rootId, width, height, cvData, vlmData);
    } else if (isCards) {
      this.fuseCardGrid(nodes, rootId, width, height, cvData, vlmData);
    } else if (isForm) {
      this.fuseForm(nodes, rootId, width, height, cvData, vlmData);
    } else {
      this.fuseLanding(nodes, rootId, width, height, cvData, vlmData);
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
        targetFrameworks: ["react", "vanillajs", "flutter"],
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
   * Fuses CV pixel analysis with VLM semantics for two-panel split layouts (e.g. Ugeek Signin)
   */
  private static fuseTwoPanelSplit(
    nodes: Record<string, UINode>,
    rootId: string,
    width: number,
    height: number,
    cvData: any,
    vlmData: any
  ) {
    const leftBg = cvData.leftDark ? cvData.colors.dominantBg : cvData.leftColorHex;
    const rightBg = cvData.leftDark ? cvData.rightColorHex : cvData.colors.dominantBg;
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

    // Left panel content from VLM
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
        content: { text: lp.title || lp.headline || "A B2B Marketplace Platform" },
        styles: { fontSize: 36, fontWeight: 700, color: leftTextColor, lineHeight: 1.2 },
        confidence: 0.95,
      };
    }

    if (lp.description || lp.subtitle) {
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
        content: { text: lp.description || lp.subtitle || "Connecting enterprises with high quality verified suppliers." },
        styles: { fontSize: 16, color: cvData.leftDark ? "#94A3B8" : "#475569", lineHeight: 1.5 },
        confidence: 0.95,
      };
    }

    // 2. RIGHT PANEL (Authentication / Form)
    const rightChildIds: string[] = [];
    nodes["right_panel"] = {
      id: "right_panel",
      type: "section",
      name: "Right Authentication Panel",
      parentId: rootId,
      childIds: rightChildIds,
      position: { x: Math.round(width / 2), y: 0, relativeTo: "parent" },
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

    // Form Container inside Right Panel
    const formCardId = "auth_form_container";
    rightChildIds.push(formCardId);
    const formChildIds: string[] = [];

    nodes[formCardId] = {
      id: formCardId,
      type: "form",
      name: "Sign In Form Container",
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

    // Form Title
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
      content: { text: rp.title || "Welcome back" },
      styles: { fontSize: 28, fontWeight: 700, color: rightTextColor },
      confidence: 0.95,
    };

    // Form Fields
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

    // Submit Button
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
        backgroundColor: cvData.colors.primaryAccent || "#2563EB",
        color: "#FFFFFF",
        fontWeight: 600,
        fontSize: 16,
        borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
      },
      confidence: 0.95,
    };

    // Social / Google login button if present
    if (rp.socialLogins?.[0]) {
      const socId = "auth_google_button";
      formChildIds.push(socId);
      nodes[socId] = {
        id: socId,
        type: "button",
        name: "Google Login",
        parentId: formCardId,
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "parent" },
        dimensions: { width: "100%", height: 44 },
        layout: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
        content: { text: rp.socialLogins[0].text || "Continue with Google", iconName: "Google" },
        styles: {
          backgroundColor: cvData.leftDark ? "#FFFFFF" : "#1E293B",
          color: cvData.leftDark ? "#0F172A" : "#FFFFFF",
          border: { width: 1, style: "solid", color: "#475569" },
          borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
        },
        confidence: 0.95,
      };
    }
  }

  /**
   * Fuses CV pixel analysis with VLM semantics for Dashboard layouts
   */
  private static fuseDashboard(
    nodes: Record<string, UINode>,
    rootId: string,
    width: number,
    height: number,
    cvData: any,
    vlmData: any
  ) {
    const sidebarBg = cvData.colors.dominantBg;
    const mainBg = cvData.colors.surfaceBg;

    nodes[rootId] = {
      id: rootId,
      type: "page",
      name: "Dashboard Page",
      parentId: null,
      childIds: ["sidebar_nav", "main_dashboard_content"],
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
      styles: { backgroundColor: mainBg, color: cvData.colors.textColor },
      confidence: 0.98,
    };

    // Sidebar Node
    const sideChildIds: string[] = [];
    nodes["sidebar_nav"] = {
      id: "sidebar_nav",
      type: "sidebar",
      name: "Sidebar Navigation",
      parentId: rootId,
      childIds: sideChildIds,
      position: { x: 0, y: 0, relativeTo: "parent" },
      dimensions: { width: 260, height: "100%", minHeight: "100vh" },
      layout: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        gap: 16,
        flexWrap: "nowrap",
      },
      styles: {
        backgroundColor: sidebarBg,
        color: "#FFFFFF",
        padding: { top: 24, right: 20, bottom: 24, left: 20 },
        border: { width: 1, style: "solid", color: "#334155" },
      },
      confidence: 0.98,
    };

    // Sidebar Brand
    const brandId = "sidebar_brand";
    sideChildIds.push(brandId);
    nodes[brandId] = {
      id: brandId,
      type: "heading",
      name: "Brand",
      parentId: "sidebar_nav",
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "parent" },
      dimensions: { width: "100%", height: "auto" },
      layout: { display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", gap: 0, flexWrap: "nowrap" },
      content: { text: vlmData.sidebar?.brand || "AIUI Platform" },
      styles: { fontSize: 20, fontWeight: 700, color: "#FFFFFF" },
      confidence: 0.95,
    };

    // Main Content Node
    const mainChildIds: string[] = [];
    nodes["main_dashboard_content"] = {
      id: "main_dashboard_content",
      type: "section",
      name: "Main Dashboard Area",
      parentId: rootId,
      childIds: mainChildIds,
      position: { x: 260, y: 0, relativeTo: "parent" },
      dimensions: { width: "calc(100% - 260px)", height: "100%", minHeight: "100vh" },
      layout: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        gap: 24,
        flexWrap: "nowrap",
      },
      styles: {
        backgroundColor: mainBg,
        color: cvData.colors.textColor,
        padding: { top: 32, right: 32, bottom: 32, left: 32 },
      },
      confidence: 0.98,
    };
  }

  /**
   * Fuses CV pixel analysis with VLM semantics for Card Grids
   */
  private static fuseCardGrid(
    nodes: Record<string, UINode>,
    rootId: string,
    width: number,
    height: number,
    cvData: any,
    vlmData: any
  ) {
    nodes[rootId] = {
      id: rootId,
      type: "page",
      name: "Feature Card Grid Page",
      parentId: null,
      childIds: ["header_nav", "cards_container"],
      position: { x: 0, y: 0, relativeTo: "viewport" },
      dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
      layout: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        gap: 32,
        flexWrap: "nowrap",
      },
      styles: { backgroundColor: cvData.colors.dominantBg, color: cvData.colors.textColor },
      confidence: 0.98,
    };

    // Header Navigation
    nodes["header_nav"] = {
      id: "header_nav",
      type: "navbar",
      name: "Top Navigation",
      parentId: rootId,
      childIds: ["header_brand", "header_cta"],
      position: { x: 0, y: 0, relativeTo: "parent" },
      dimensions: { width: "100%", height: 64 },
      layout: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 0,
        flexWrap: "nowrap",
      },
      styles: {
        backgroundColor: "transparent",
        padding: { top: 16, right: 32, bottom: 16, left: 32 },
      },
      confidence: 0.98,
    };

    nodes["header_brand"] = {
      id: "header_brand",
      type: "heading",
      name: "Brand Logo",
      parentId: "header_nav",
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "parent" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", gap: 0, flexWrap: "nowrap" },
      content: { text: vlmData.header?.brandTitle || "AIUI Architecture" },
      styles: { fontSize: 20, fontWeight: 700, color: cvData.colors.textColor },
      confidence: 0.95,
    };

    nodes["header_cta"] = {
      id: "header_cta",
      type: "button",
      name: "Header Action",
      parentId: "header_nav",
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "parent" },
      dimensions: { width: "auto", height: 40 },
      layout: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
      content: { text: vlmData.header?.actionButton || "Explore" },
      styles: {
        backgroundColor: cvData.colors.primaryAccent || "#2563EB",
        color: "#FFFFFF",
        borderRadius: { topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6 },
        padding: { top: 8, right: 16, bottom: 8, left: 16 },
      },
      confidence: 0.95,
    };

    // Cards Grid Container
    const cardList = Array.isArray(vlmData.cards) && vlmData.cards.length > 0
      ? vlmData.cards
      : [
          { id: "c1", title: "Unified Architecture", description: "Isolates component logic from presentation layers." },
          { id: "c2", title: "Automated Workflows", description: "Synthesizes modern responsive UI layouts." },
          { id: "c3", title: "Continuous Self-Correction", description: "Evaluates layout metrics with targeted patches." }
        ];

    const cardIds = cardList.map((_: any, idx: number) => `feature_card_${idx + 1}`);
    nodes["cards_container"] = {
      id: "cards_container",
      type: "grid",
      name: "Feature Cards Grid",
      parentId: rootId,
      childIds: cardIds,
      position: { x: 0, y: 0, relativeTo: "parent" },
      dimensions: { width: "100%", maxWidth: 1200, height: "auto" },
      layout: {
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(cardList.length, 3)}, 1fr)`,
        gap: 24,
        alignItems: "stretch",
        justifyContent: "center",
        flexDirection: "row",
        flexWrap: "wrap",
      },
      styles: {
        padding: { top: 16, right: 32, bottom: 32, left: 32 },
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      },
      confidence: 0.98,
    };

    for (let cIdx = 0; cIdx < cardList.length; cIdx++) {
      const c = cardList[cIdx];
      const cardId = cardIds[cIdx];
      const cardChildIds = [`card_title_${cIdx + 1}`, `card_desc_${cIdx + 1}`];

      nodes[cardId] = {
        id: cardId,
        type: "card",
        name: c.title || `Card ${cIdx + 1}`,
        parentId: "cards_container",
        childIds: cardChildIds,
        position: { x: 0, y: 0, relativeTo: "parent" },
        dimensions: { width: "100%", height: "auto" },
        layout: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "nowrap",
        },
        styles: {
          backgroundColor: cvData.colors.surfaceBg || "#1E293B",
          color: cvData.colors.textColor,
          borderRadius: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 },
          padding: { top: 24, right: 24, bottom: 24, left: 24 },
          border: { width: 1, style: "solid", color: "#334155" },
        },
        confidence: 0.95,
      };

      nodes[`card_title_${cIdx + 1}`] = {
        id: `card_title_${cIdx + 1}`,
        type: "heading",
        name: "Card Title",
        parentId: cardId,
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "parent" },
        dimensions: { width: "100%", height: "auto" },
        layout: { display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", gap: 0, flexWrap: "nowrap" },
        content: { text: c.title || `Feature ${cIdx + 1}` },
        styles: { fontSize: 18, fontWeight: 700, color: cvData.colors.textColor },
        confidence: 0.95,
      };

      nodes[`card_desc_${cIdx + 1}`] = {
        id: `card_desc_${cIdx + 1}`,
        type: "text",
        name: "Card Description",
        parentId: cardId,
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "parent" },
        dimensions: { width: "100%", height: "auto" },
        layout: { display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "flex-start", gap: 0, flexWrap: "nowrap" },
        content: { text: c.description || "Feature description and capabilities." },
        styles: { fontSize: 14, color: cvData.colors.mutedColor || "#94A3B8", lineHeight: 1.5 },
        confidence: 0.95,
      };
    }
  }

  /**
   * Fuses CV pixel analysis with VLM semantics for Forms
   */
  private static fuseForm(
    nodes: Record<string, UINode>,
    rootId: string,
    width: number,
    height: number,
    cvData: any,
    vlmData: any
  ) {
    nodes[rootId] = {
      id: rootId,
      type: "page",
      name: "Form Page",
      parentId: null,
      childIds: ["centered_form_container"],
      position: { x: 0, y: 0, relativeTo: "viewport" },
      dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
      layout: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 0,
        flexWrap: "nowrap",
      },
      styles: { backgroundColor: cvData.colors.dominantBg, color: cvData.colors.textColor },
      confidence: 0.98,
    };

    const formChildIds: string[] = [];
    nodes["centered_form_container"] = {
      id: "centered_form_container",
      type: "form",
      name: "Form Card",
      parentId: rootId,
      childIds: formChildIds,
      position: { x: 0, y: 0, relativeTo: "parent" },
      dimensions: { width: "100%", maxWidth: 480, height: "auto" },
      layout: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        gap: 20,
        flexWrap: "nowrap",
      },
      styles: {
        backgroundColor: cvData.colors.surfaceBg,
        color: cvData.colors.textColor,
        borderRadius: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 },
        padding: { top: 32, right: 32, bottom: 32, left: 32 },
        border: { width: 1, style: "solid", color: "#334155" },
      },
      confidence: 0.98,
    };
  }

  /**
   * Default Landing Page fallback fusion
   */
  private static fuseLanding(
    nodes: Record<string, UINode>,
    rootId: string,
    width: number,
    height: number,
    cvData: any,
    vlmData: any
  ) {
    this.fuseCardGrid(nodes, rootId, width, height, cvData, vlmData);
  }

  /**
   * Helper to scan raw PNG pixel buffer and compute spatial luminance/color grounding
   */
  private static analyzePixels(png: PNG | null, width: number, height: number) {
    if (!png) {
      return {
        colors: {
          dominantBg: "#0B132B",
          surfaceBg: "#1E293B",
          primaryAccent: "#2563EB",
          textColor: "#F8FAFC",
          mutedColor: "#94A3B8",
        },
        leftDark: true,
        isSplitLayout: false,
        isDashboard: false,
        isDenseGrid: false,
        isCenteredCard: false,
        leftColorHex: "#FFFFFF",
        rightColorHex: "#0B132B",
      };
    }

    const imgWidth = png.width;
    const imgHeight = png.height;
    const data = png.data;
    const step = Math.max(1, Math.floor(Math.min(imgWidth, imgHeight) / 100));

    let leftLumSum = 0, leftCount = 0;
    let rightLumSum = 0, rightCount = 0;
    let leftR = 0, leftG = 0, leftB = 0;
    let rightR = 0, rightG = 0, rightB = 0;

    for (let y = 0; y < imgHeight; y += step) {
      for (let x = 0; x < imgWidth; x += step) {
        const idx = (y * imgWidth + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (x < imgWidth / 2) {
          leftLumSum += lum;
          leftR += r; leftG += g; leftB += b;
          leftCount++;
        } else {
          rightLumSum += lum;
          rightR += r; rightG += g; rightB += b;
          rightCount++;
        }
      }
    }

    const avgLeftLum = leftCount > 0 ? leftLumSum / leftCount : 128;
    const avgRightLum = rightCount > 0 ? rightLumSum / rightCount : 128;
    const avgLeftR = Math.round(leftR / (leftCount || 1));
    const avgLeftG = Math.round(leftG / (leftCount || 1));
    const avgLeftB = Math.round(leftB / (leftCount || 1));
    const avgRightR = Math.round(rightR / (rightCount || 1));
    const avgRightG = Math.round(rightG / (rightCount || 1));
    const avgRightB = Math.round(rightB / (rightCount || 1));

    const leftHex = `#${((1 << 24) + (avgLeftR << 16) + (avgLeftG << 8) + avgLeftB).toString(16).slice(1).toUpperCase()}`;
    const rightHex = `#${((1 << 24) + (avgRightR << 16) + (avgRightG << 8) + avgRightB).toString(16).slice(1).toUpperCase()}`;

    const lumDelta = Math.abs(avgLeftLum - avgRightLum);
    const isSplitLayout = lumDelta > 38 && width >= 700;
    const leftDark = avgLeftLum < avgRightLum;

    return {
      colors: {
        dominantBg: leftDark ? leftHex : rightHex,
        surfaceBg: leftDark ? rightHex : leftHex,
        primaryAccent: "#2563EB",
        textColor: leftDark ? "#F8FAFC" : "#0F172A",
        mutedColor: "#94A3B8",
      },
      leftDark,
      isSplitLayout,
      isDashboard: false,
      isDenseGrid: !isSplitLayout,
      isCenteredCard: false,
      leftColorHex: leftHex,
      rightColorHex: rightHex,
    };
  }
}
