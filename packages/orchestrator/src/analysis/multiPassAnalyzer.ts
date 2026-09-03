import { UIIRDocument, UIIRDocumentSchema, UINode, UINodeType } from "@aiui/core";
import { ModelCallResult } from "../providers/types.js";
import { CostLogEntry, PipelineStage } from "../types.js";
import { VisualGrounding, BoundingBoxRect } from "./visualGrounding.js";

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

export interface MultiPassAnalyzerOptions {
  providerName: string;
  modelName: string;
  maxRegions?: number;
  stage?: PipelineStage;
}

export function normalizeNodeType(rawType: any, rawContent?: any): { type: UINodeType; content: any } {
  const content: any = {};
  if (rawContent && typeof rawContent === "object") {
    for (const [k, v] of Object.entries(rawContent)) {
      if (v !== null && v !== undefined) {
        content[k] = v;
      }
    }
  }
  const strType = typeof rawType === "string" ? rawType.toLowerCase().trim() : "text";

  const validTypes = new Set([
    "page", "section", "container", "navbar", "sidebar", "header", "footer",
    "hero", "card", "grid", "flex", "button", "heading", "text", "input",
    "image", "icon", "badge", "avatar", "list", "modal", "form", "stat", "divider"
  ]);

  if (validTypes.has(strType)) {
    return { type: strType as UINodeType, content };
  }

  // Explicit semantic mappings preserving UI intent
  switch (strType) {
    case "paragraph":
    case "p":
    case "span":
    case "caption":
    case "subtitle":
    case "description":
    case "body":
      return { type: "text", content };

    case "label":
      return { type: "text", content };

    case "link":
    case "a":
    case "anchor":
      return { type: "text", content };

    case "checkbox":
      return { type: "input", content: { ...content, placeholder: content.text || content.placeholder || "[ ] Checkbox" } };

    case "list_item":
    case "li":
    case "item":
      return { type: "text", content };

    case "title":
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return { type: "heading", content };

    case "img":
    case "photo":
    case "picture":
    case "logo":
      return { type: "image", content };

    case "textfield":
    case "textbox":
    case "search":
      return { type: "input", content };

    case "cta":
    case "action":
    case "submit":
      return { type: "button", content };

    case "row":
    case "column":
    case "box":
    case "wrapper":
    case "layout":
      return { type: "container", content };

    default:
      return { type: "container", content };
  }
}

export function normalizeStyles(rawStyles: any): any {
  if (!rawStyles || typeof rawStyles !== "object") return {};
  const styles: any = { ...rawStyles };

  if (styles.borderRadius !== undefined) {
    if (typeof styles.borderRadius === "number") {
      const r = styles.borderRadius;
      styles.borderRadius = { topLeft: r, topRight: r, bottomRight: r, bottomLeft: r };
    } else if (typeof styles.borderRadius === "string") {
      const num = parseInt(styles.borderRadius, 10) || 0;
      styles.borderRadius = { topLeft: num, topRight: num, bottomRight: num, bottomLeft: num };
    } else if (typeof styles.borderRadius === "object" && styles.borderRadius !== null) {
      styles.borderRadius = {
        topLeft: Number(styles.borderRadius.topLeft || styles.borderRadius.top || 0),
        topRight: Number(styles.borderRadius.topRight || styles.borderRadius.top || 0),
        bottomRight: Number(styles.borderRadius.bottomRight || styles.borderRadius.bottom || 0),
        bottomLeft: Number(styles.borderRadius.bottomLeft || styles.borderRadius.bottom || 0),
      };
    }
  }

  if (styles.padding !== undefined) {
    if (typeof styles.padding === "number") {
      const p = styles.padding;
      styles.padding = { top: p, right: p, bottom: p, left: p };
    } else if (typeof styles.padding === "string") {
      const num = parseInt(styles.padding, 10) || 0;
      styles.padding = { top: num, right: num, bottom: num, left: num };
    } else if (typeof styles.padding === "object" && styles.padding !== null) {
      styles.padding = {
        top: Number(styles.padding.top || 0),
        right: Number(styles.padding.right || 0),
        bottom: Number(styles.padding.bottom || 0),
        left: Number(styles.padding.left || 0),
      };
    }
  }

  if (styles.margin !== undefined) {
    if (typeof styles.margin === "number") {
      const m = styles.margin;
      styles.margin = { top: m, right: m, bottom: m, left: m };
    } else if (typeof styles.margin === "string") {
      const num = parseInt(styles.margin, 10) || 0;
      styles.margin = { top: num, right: num, bottom: num, left: num };
    } else if (typeof styles.margin === "object" && styles.margin !== null) {
      styles.margin = {
        top: Number(styles.margin.top || 0),
        right: Number(styles.margin.right || 0),
        bottom: Number(styles.margin.bottom || 0),
        left: Number(styles.margin.left || 0),
      };
    }
  }

  if (styles.border !== undefined) {
    if (typeof styles.border === "string") {
      const parts = styles.border.split(/\s+/);
      let width = 1;
      let style: "solid" | "dashed" | "dotted" | "none" = "solid";
      let color = "transparent";
      for (const p of parts) {
        if (/^\d+px$/.test(p) || /^\d+$/.test(p)) {
          width = parseInt(p, 10) || 1;
        } else if (["solid", "dashed", "dotted", "none"].includes(p.toLowerCase())) {
          style = p.toLowerCase() as any;
        } else if (p.startsWith("#") || p.startsWith("rgb") || p.startsWith("hsl") || p === "transparent") {
          color = p;
        }
      }
      styles.border = { width, style, color };
    } else if (typeof styles.border === "object" && styles.border !== null) {
      styles.border = {
        width: Number(styles.border.width || 0),
        style: ["solid", "dashed", "dotted", "none"].includes(styles.border.style) ? styles.border.style : "solid",
        color: String(styles.border.color || "transparent"),
      };
    } else {
      delete styles.border;
    }
  }

  if (styles.opacity !== undefined) {
    let op = Number(styles.opacity);
    if (isNaN(op)) delete styles.opacity;
    else {
      if (op > 1) op = op / 100;
      styles.opacity = Math.max(0, Math.min(1, op));
    }
  }

  if (styles.textAlign && !["left", "center", "right", "justify"].includes(styles.textAlign)) {
    delete styles.textAlign;
  }

  if (styles.textTransform && !["none", "uppercase", "lowercase", "capitalize"].includes(styles.textTransform)) {
    delete styles.textTransform;
  }

  return styles;
}

export class MultiPassVisionAnalyzer {
  public static readonly MAX_REGIONS_DEFAULT = 8;

  /**
   * Executes a multi-pass decomposed visual analysis pipeline:
   * Pass 1: Macro-structure & Regions (grounded via 8x6 grid overlay)
   * Pass 2: Per-region focused element extraction (grounded via high-res crops, capped at 8)
   * Pass 3: Design tokens & style extraction (colors, fonts, radii)
   * Pass 4: Self-critique & synthesis
   */
  public static async analyze(
    imageBuffer: Buffer,
    mimeType: string,
    viewport: { width: number; height: number },
    docName: string,
    caller: VisionCaller,
    options: MultiPassAnalyzerOptions
  ): Promise<ModelCallResult<UIIRDocument>> {
    const startTime = Date.now();
    const maxRegions = options.maxRegions || MultiPassVisionAnalyzer.MAX_REGIONS_DEFAULT;
    const stage = options.stage || "analyzing";
    const costLogs: CostLogEntry[] = [];

    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalCostUsd = 0;

    const recordCall = (res: VisionCallResponse, stepName: string) => {
      totalPromptTokens += res.promptTokens;
      totalCompletionTokens += res.completionTokens;
      totalCostUsd += res.costUsd;
      costLogs.push({
        stage,
        provider: `${options.providerName}:${stepName}`,
        model: options.modelName,
        promptTokens: res.promptTokens,
        completionTokens: res.completionTokens,
        estimatedCostUsd: Number(res.costUsd.toFixed(6)),
        latencyMs: res.latencyMs,
        timestamp: new Date().toISOString(),
      });
    };

    // 1. Generate 8x6 Numbered Grid Overlay for Spatial Grounding
    const gridOverlay = await VisualGrounding.generateGridOverlay(imageBuffer, 8, 6);

    // =========================================================================
    // PASS 1 — MACRO STRUCTURE & REGION IDENTIFICATION
    // =========================================================================
    const pass1Prompt = `You are an expert UI Vision Decomposition Engine.
Look at the UI screenshot which has an overlaid 8x6 coordinate grid (columns A-H, rows 1-6).
Analyze the top-level macro-architecture and partition the UI into major structural regions.

FEW-SHOT WORKED EXAMPLES:
Example 1 (Two-Panel Split Screen, e.g. Left Brand + Right Form):
{
  "rootLayout": { "display": "flex", "flexDirection": "row", "alignItems": "stretch", "justifyContent": "flex-start", "gap": 0 },
  "regions": [
    { "id": "left_panel", "name": "Brand Hero Section", "role": "section", "gridRange": "A1:D6", "widthPercent": "50%", "minHeight": "100vh" },
    { "id": "right_panel", "name": "Authentication Form Panel", "role": "section", "gridRange": "E1:H6", "widthPercent": "50%", "minHeight": "100vh" }
  ]
}

Example 2 (Navbar + Hero + 3-Column Feature Cards):
{
  "rootLayout": { "display": "flex", "flexDirection": "column", "alignItems": "stretch", "justifyContent": "flex-start", "gap": 0 },
  "regions": [
    { "id": "nav_section", "name": "Header Navigation", "role": "navbar", "gridRange": "A1:H1", "widthPercent": "100%", "minHeight": "64px" },
    { "id": "hero_section", "name": "Hero Banner", "role": "hero", "gridRange": "A2:H3", "widthPercent": "100%", "minHeight": "360px" },
    { "id": "card_grid_section", "name": "Features Grid", "role": "grid", "gridRange": "A4:H6", "widthPercent": "100%", "minHeight": "380px" }
  ]
}

STRICT GROUNDING INSTRUCTIONS:
- Reference the grid cell coordinates (e.g. "A1:D6") accurately.
- DO NOT invent sub-elements yet. Only output top-level structural regions.
- Set rootLayout.flexDirection to "row" if the layout is split horizontally (left/right panels), or "column" if stacked vertically.
- Output JSON strictly matching the schema above.`;

    const pass1Res = await caller({
      prompt: pass1Prompt,
      images: [gridOverlay.buffer],
      mimeType: "image/png",
      jsonMode: true,
    });
    recordCall(pass1Res, "pass1_structure");

    let pass1Data: any = {};
    try {
      pass1Data = JSON.parse(pass1Res.text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim());
    } catch {
      pass1Data = {
        rootLayout: { display: "flex", flexDirection: "row", alignItems: "stretch", justifyContent: "flex-start", gap: 0 },
        regions: [
          { id: "left_panel", name: "Left Panel", role: "section", gridRange: "A1:D6", widthPercent: "50%" },
          { id: "right_panel", name: "Right Panel", role: "section", gridRange: "E1:H6", widthPercent: "50%" },
        ],
      };
    }

    let rawRegions: any[] = Array.isArray(pass1Data.regions) && pass1Data.regions.length > 0
      ? pass1Data.regions
      : [
          { id: "left_panel", name: "Left Panel", role: "section", gridRange: "A1:D6", widthPercent: "50%" },
          { id: "right_panel", name: "Right Panel", role: "section", gridRange: "E1:H6", widthPercent: "50%" },
        ];

    // Cap region call volume to prevent unbounded API explosion
    if (rawRegions.length > maxRegions) {
      console.warn(`[MultiPassVisionAnalyzer Warning] Detected ${rawRegions.length} regions. Capping at max ${maxRegions} to prevent excessive API calls.`);
      rawRegions = rawRegions.slice(0, maxRegions);
    }

    const rootLayout = pass1Data.rootLayout || { display: "flex", flexDirection: "column", alignItems: "stretch" };

    // =========================================================================
    // PASS 2 — FOCUSED PER-REGION DETAIL (WITH CROPPED SUB-IMAGES)
    // =========================================================================
    const nodes: Record<string, UINode> = {};
    const rootNodeId = "page_root";
    const regionIds: string[] = [];

    // Initialize Root Page Node
    nodes[rootNodeId] = {
      id: rootNodeId,
      type: "page",
      name: "Page",
      parentId: null,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "viewport" },
      dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
      layout: {
        display: "flex",
        flexDirection: rootLayout.flexDirection === "row" ? "row" : "column",
        justifyContent: rootLayout.justifyContent || "flex-start",
        alignItems: rootLayout.alignItems || "stretch",
        gap: rootLayout.gap || 0,
        flexWrap: "nowrap",
      },
      styles: {
        backgroundColor: "#0B132B",
        color: "#F8FAFC",
      },
      confidence: 0.95,
    };

    for (let rIdx = 0; rIdx < rawRegions.length; rIdx++) {
      const reg = rawRegions[rIdx];
      const regionId = reg.id || `region_${rIdx + 1}`;
      regionIds.push(regionId);

      // Compute pixel crop coordinates from gridRange or boundingBox
      let cropBox: BoundingBoxRect | null = null;
      if (reg.gridRange) {
        cropBox = VisualGrounding.parseGridCellRange(reg.gridRange, viewport.width, viewport.height);
      }
      if (!cropBox && reg.boundingBox) {
        cropBox = {
          x: reg.boundingBox.x || 0,
          y: reg.boundingBox.y || 0,
          width: reg.boundingBox.width || viewport.width / rawRegions.length,
          height: reg.boundingBox.height || viewport.height,
        };
      }
      if (!cropBox) {
        const sliceWidth = Math.round(viewport.width / rawRegions.length);
        cropBox = { x: rIdx * sliceWidth, y: 0, width: sliceWidth, height: viewport.height };
      }

      // Crop high-resolution sub-image for this region
      const regionCropBuffer = await VisualGrounding.cropRegion(imageBuffer, cropBox, viewport.width, viewport.height);

      const pass2Prompt = `You are a high-precision UI Element Perception Agent.
Analyze this focused high-resolution crop of region '${reg.name || regionId}' (Role: ${reg.role || "section"}).

Extract every single UI element visible within this cropped region in natural top-to-bottom, left-to-right visual order.

SCHEMA SPECIFICATION:
{
  "regionLayout": { "display": "flex", "flexDirection": "column", "gap": 16, "alignItems": "stretch", "justifyContent": "center" },
  "elements": [
    {
      "id": "${regionId}_title",
      "type": "heading",
      "text": "Exact text from screenshot",
      "styles": { "fontSize": 28, "fontWeight": 700, "color": "#..." }
    },
    {
      "id": "${regionId}_email_input",
      "type": "input",
      "placeholder": "name@company.com",
      "inputType": "email",
      "styles": { "backgroundColor": "#...", "color": "#..." }
    },
    {
      "id": "${regionId}_submit_btn",
      "type": "button",
      "text": "Sign In",
      "variant": "primary",
      "styles": { "backgroundColor": "#...", "color": "#FFFFFF" }
    }
  ]
}

ALLOWED TYPES:
"heading" | "text" | "button" | "input" | "icon" | "image" | "badge" | "card" | "form" | "divider" | "list" | "container" | "flex"

CRITICAL GROUNDING RULES:
1. ONLY include text, labels, buttons, placeholders, and icons that are ACTUALLY VISIBLE in this image crop.
2. DO NOT invent marketing slogans, fake company copy, or unrendered boilerplate.
3. For icons, specify "iconName" using standard Lucide names (e.g. "Mail", "Lock", "Search", "Check", "ArrowRight", "Google", "Github", "Sparkles").
4. For inputs, provide placeholder and inputType ("text"|"email"|"password"|"number").
5. Output pure JSON matching the schema.`;

      const pass2Res = await caller({
        prompt: pass2Prompt,
        images: [regionCropBuffer],
        mimeType: "image/png",
        jsonMode: true,
      });
      recordCall(pass2Res, `pass2_region_${rIdx + 1}`);

      let regionDetail: any = {};
      try {
        regionDetail = JSON.parse(pass2Res.text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim());
      } catch {
        regionDetail = { elements: [] };
      }

      // Build Region Node
      const regionChildIds: string[] = [];
      const regionType = reg.role === "navbar" ? "navbar" : reg.role === "sidebar" ? "sidebar" : reg.role === "card" ? "card" : "section";
      const regionWidth = reg.widthPercent || (rootLayout.flexDirection === "row" ? `${Math.round(100 / rawRegions.length)}%` : "100%");

      nodes[regionId] = {
        id: regionId,
        type: regionType as any,
        name: reg.name || `Region ${rIdx + 1}`,
        parentId: rootNodeId,
        childIds: regionChildIds,
        position: { x: cropBox.x, y: cropBox.y, relativeTo: "parent" },
        dimensions: {
          width: regionWidth,
          height: "100%",
          minHeight: reg.minHeight || "100vh",
        },
        layout: regionDetail.regionLayout || {
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "stretch",
          justifyContent: "center",
        },
        styles: {
          padding: { top: 32, right: 32, bottom: 32, left: 32 },
        },
        confidence: 0.95,
      };

      // Add Child Element Nodes
      const elements = Array.isArray(regionDetail.elements) ? regionDetail.elements : [];
      for (let eIdx = 0; eIdx < elements.length; eIdx++) {
        const el = elements[eIdx];
        const elId = el.id || `${regionId}_el_${eIdx + 1}`;
        regionChildIds.push(elId);

        const normalized = normalizeNodeType(el.type, {
          text: el.text,
          placeholder: el.placeholder,
          inputType: el.inputType,
          iconName: el.iconName,
          alt: el.alt,
          src: el.src,
        });

        nodes[elId] = {
          id: elId,
          type: normalized.type,
          name: el.text || el.placeholder || `Element ${eIdx + 1}`,
          parentId: regionId,
          childIds: el.childIds || [],
          position: { x: 0, y: 0, relativeTo: "parent" },
          dimensions: {
            width: normalized.type === "button" || normalized.type === "input" ? "100%" : "auto",
            height: normalized.type === "button" || normalized.type === "input" ? 44 : "auto",
          },
          layout: el.layout || {
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            justifyContent: "flex-start",
            gap: 0,
            flexWrap: "nowrap",
          },
          content: normalized.content,
          styles: normalizeStyles(el.styles),
          confidence: 0.95,
        };
      }
    }

    nodes[rootNodeId].childIds = regionIds;

    // =========================================================================
    // PASS 3 — DESIGN TOKENS & COLOR PALETTE EXTRACTION
    // =========================================================================
    const pass3Prompt = `You are a Design System Token & Palette Extraction Agent.
Analyze the full UI screenshot and extract the exact hex color codes, typography scales, and border radius used across the interface.

SCHEMA SPECIFICATION:
{
  "dominantBg": "#0B132B",
  "surfaceBg": "#1E293B",
  "primaryAccent": "#2563EB",
  "textColor": "#F8FAFC",
  "mutedTextColor": "#94A3B8",
  "borderColor": "#334155",
  "fontFamily": "Inter, system-ui, sans-serif",
  "borderRadius": 8
}

Output pure JSON matching the schema.`;

    const pass3Res = await caller({
      prompt: pass3Prompt,
      images: [imageBuffer],
      mimeType: mimeType || "image/png",
      jsonMode: true,
    });
    recordCall(pass3Res, "pass3_tokens");

    let tokensData: any = {};
    try {
      tokensData = JSON.parse(pass3Res.text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim());
    } catch {
      tokensData = {
        dominantBg: "#0B132B",
        surfaceBg: "#FFFFFF",
        primaryAccent: "#2563EB",
        textColor: "#F8FAFC",
        mutedTextColor: "#94A3B8",
      };
    }

    // Apply tokens to root styles if missing
    if (tokensData.dominantBg) {
      nodes[rootNodeId].styles = {
        ...nodes[rootNodeId].styles,
        backgroundColor: tokensData.dominantBg,
        color: tokensData.textColor || "#F8FAFC",
      };
    }

    // =========================================================================
    // PASS 4 — SELF-CHECK / CRITIQUE & PATCH PASS
    // =========================================================================
    const nodeSummary = Object.values(nodes)
      .map(n => `- [${n.id}] (${n.type}): text="${n.content?.text || n.content?.placeholder || ''}" width=${n.dimensions?.width}`)
      .join("\n");

    const pass4Prompt = `You are a UI Quality Assurance & Structural Verification Agent.
Compare this synthesized UI IR document against the actual provided screenshot:

SYNTHESIZED NODES:
${nodeSummary}

CRITIQUE QUESTIONS:
1. Did we miss any crucial interactive elements (e.g. social login buttons like Google/Github, secondary actions, checkboxes, forgot password links, trust badges)?
2. Are all text values accurate to the image, without hallucinated marketing copy?
3. Is the macro layout direction correct (e.g. two-panel split screen vs single column)?

SCHEMA SPECIFICATION:
{
  "accurate": true,
  "missingElements": [
    {
      "targetRegionId": "right_panel",
      "type": "button",
      "text": "Continue with Google",
      "iconName": "Google"
    }
  ],
  "correctedText": {
    "node_id": "corrected exact text"
  }
}

Output pure JSON matching the schema.`;

    const pass4Res = await caller({
      prompt: pass4Prompt,
      images: [imageBuffer],
      mimeType: mimeType || "image/png",
      jsonMode: true,
    });
    recordCall(pass4Res, "pass4_critique");

    try {
      const critiqueData = JSON.parse(pass4Res.text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim());
      // Apply missing elements
      if (Array.isArray(critiqueData.missingElements)) {
        for (let mIdx = 0; mIdx < critiqueData.missingElements.length; mIdx++) {
          const miss = critiqueData.missingElements[mIdx];
          const targetRegId = miss.targetRegionId && nodes[miss.targetRegionId] ? miss.targetRegionId : regionIds[0] || rootNodeId;
          const missId = `critique_added_${mIdx + 1}`;

          const normalized = normalizeNodeType(miss.type || "button", {
            text: miss.text,
            iconName: miss.iconName,
            placeholder: miss.placeholder,
            inputType: miss.inputType,
          });

          nodes[missId] = {
            id: missId,
            type: normalized.type,
            name: miss.text || `Added Element ${mIdx + 1}`,
            parentId: targetRegId,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "parent" },
            dimensions: { width: "100%", height: 44 },
            layout: {
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              justifyContent: "flex-start",
              gap: 0,
              flexWrap: "nowrap",
            },
            content: normalized.content,
            styles: normalizeStyles({
              backgroundColor: normalized.type === "button" ? tokensData.primaryAccent || "#2563EB" : undefined,
              color: "#FFFFFF",
            }),
            confidence: 0.95,
          };

          if (nodes[targetRegId] && !nodes[targetRegId].childIds.includes(missId)) {
            nodes[targetRegId].childIds.push(missId);
          }
        }
      }

      // Apply text corrections
      if (critiqueData.correctedText && typeof critiqueData.correctedText === "object") {
        for (const [nId, corrText] of Object.entries(critiqueData.correctedText)) {
          if (nodes[nId] && typeof corrText === "string") {
            if (nodes[nId].type === "input") {
              nodes[nId].content = { ...nodes[nId].content, placeholder: corrText };
            } else {
              nodes[nId].content = { ...nodes[nId].content, text: corrText };
            }
          }
        }
      }
    } catch {
      // Critique parsing failed non-critically
    }

    const totalLatency = Date.now() - startTime;

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
      viewport: {
        width: viewport.width,
        height: viewport.height,
        devicePixelRatio: 1,
      },
      rootNodeId,
      nodes,
      metadata: {
        sourceType: "screenshot",
        confidence: 0.96,
        extractedAt: new Date().toISOString(),
        targetFrameworks: ["react", "vanillajs", "flutter"],
      },
    };

    const validatedDoc = UIIRDocumentSchema.parse(synthesizedDoc);

    return {
      data: validatedDoc,
      costLog: {
        stage,
        provider: `${options.providerName} (multi-pass)`,
        model: options.modelName,
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        estimatedCostUsd: Number(totalCostUsd.toFixed(6)),
        latencyMs: totalLatency,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
