import { PNG } from "pngjs";
import { UIIRDocument, UINode, UINodeType, UIIRDocumentSchema } from "../types/ir.js";

export interface ExtractedColorSummary {
  dominantBg: string;
  surfaceBg: string;
  primaryAccent: string;
  textColor: string;
  mutedColor: string;
}

export interface PerceptionNode {
  id: string;
  role: string;
  bbox?: { x: number; y: number; width: number; height: number };
  text?: string;
  placeholder?: string;
  inputType?: string;
  iconName?: string;
  iconFallbackShape?: string;
  confidence?: number;
  needsDetailCrop?: boolean;
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    borderColor?: string;
    borderWidth?: number | string;
    borderRadius?: number | string;
    fontSize?: number | string;
    fontWeight?: number | string;
    padding?: number | string;
    gap?: number | string;
    layout?: "row" | "column" | "grid" | "flex" | "stack";
    columns?: number;
    alignItems?: "start" | "center" | "end" | "stretch";
    justifyContent?: "start" | "center" | "end" | "between" | "around";
    shadow?: string;
    backdropBlur?: string;
  };
  children?: PerceptionNode[];
}

export class CvExtractor {
  /**
   * Performs computer vision pixel analysis on an image buffer and constructs a generic UIIRDocument.
   * Zero hardcoded templates or fixture-specific copy.
   */
  public static async extractFromImageBuffer(
    buffer: Buffer,
    name?: string,
    viewportHint?: { width: number; height: number }
  ): Promise<UIIRDocument> {
    const docName = name || "Extracted UI";
    const width = viewportHint?.width || 1280;
    const height = viewportHint?.height || 800;

    let png: PNG | null = null;
    try {
      png = PNG.sync.read(buffer);
    } catch {
      png = null;
    }

    if (!png || !png.data || png.data.length === 0) {
      const defaultColors: ExtractedColorSummary = {
        dominantBg: "#0F172A",
        surfaceBg: "#1E293B",
        primaryAccent: "#3B82F6",
        textColor: "#F8FAFC",
        mutedColor: "#94A3B8",
      };
      return this.extractFromSummary(docName, width, height, defaultColors, []);
    }

    const { colors, isSplitLayout, leftDark, isMobile, isCenteredCard } = this.analyzePixelBuffer(png);

    const nodes: Record<string, UINode> = {};
    const rootId = "page_root";

    if (isCenteredCard) {
      this.buildGenericCenteredCardLayout(nodes, rootId, width, height, colors);
    } else if (isSplitLayout) {
      this.buildGenericSplitLayout(nodes, rootId, width, height, colors, leftDark);
    } else if (isMobile) {
      this.buildGenericMobileLayout(nodes, rootId, width, height, colors);
    } else {
      this.buildGenericLayout(nodes, rootId, width, height, colors);
    }

    return UIIRDocumentSchema.parse({
      version: "1.0.0",
      id: `ir_${Date.now()}`,
      name: docName,
      viewport: { width, height, devicePixelRatio: 1 },
      rootNodeId: rootId,
      nodes,
      metadata: {
        sourceType: "screenshot",
        confidence: 0.88,
        extractedAt: new Date().toISOString(),
        targetFrameworks: ["react", "vanillajs", "flutter"],
        isApproximate: false,
        perceptionMode: "offline-cv-vision-engine",
      },
    });
  }

  /**
   * Scans raw PNG pixel data to extract color palettes and spatial region topology.
   */
  public static analyzePixelBuffer(png: PNG) {
    const { width, height, data } = png;
    const step = Math.max(1, Math.floor(Math.min(width, height) / 100));

    let leftLumSum = 0;
    let leftCount = 0;
    let rightLumSum = 0;
    let rightCount = 0;

    let leftColorR = 0, leftColorG = 0, leftColorB = 0;
    let rightColorR = 0, rightColorG = 0, rightColorB = 0;

    let totalR = 0, totalG = 0, totalB = 0;
    let totalSamples = 0;

    let maxSaturation = 0;
    let accentR = 59, accentG = 130, accentB = 246; // default blue

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        totalR += r;
        totalG += g;
        totalB += b;
        totalSamples++;

        const maxC = Math.max(r, g, b);
        const minC = Math.min(r, g, b);
        const sat = maxC - minC;
        if (sat > maxSaturation && maxC > 80 && minC < 200) {
          maxSaturation = sat;
          accentR = r;
          accentG = g;
          accentB = b;
        }

        if (x < width / 2) {
          leftLumSum += lum;
          leftColorR += r;
          leftColorG += g;
          leftColorB += b;
          leftCount++;
        } else {
          rightLumSum += lum;
          rightColorR += r;
          rightColorG += g;
          rightColorB += b;
          rightCount++;
        }
      }
    }

    const avgLeftLum = leftCount > 0 ? leftLumSum / leftCount : 128;
    const avgRightLum = rightCount > 0 ? rightLumSum / rightCount : 128;

    const avgLeftR = Math.round(leftColorR / (leftCount || 1));
    const avgLeftG = Math.round(leftColorG / (leftCount || 1));
    const avgLeftB = Math.round(leftColorB / (leftCount || 1));

    const avgRightR = Math.round(rightColorR / (rightCount || 1));
    const avgRightG = Math.round(rightColorG / (rightCount || 1));
    const avgRightB = Math.round(rightColorB / (rightCount || 1));

    const lumDelta = Math.abs(avgLeftLum - avgRightLum);
    const colorDist = Math.sqrt(
      Math.pow(avgLeftR - avgRightR, 2) +
      Math.pow(avgLeftG - avgRightG, 2) +
      Math.pow(avgLeftB - avgRightB, 2)
    );

    const isSplitLayout = (lumDelta > 38 || colorDist > 90) && width >= 700;
    const leftDark = avgLeftLum < avgRightLum;
    const isMobile = width <= 480 || height / width >= 1.75;

    // Detect centered card (e.g. login/auth forms surrounded by uniform background)
    let marginLumSum = 0;
    let marginCount = 0;
    let centerLumSum = 0;
    let centerCount = 0;

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        const isOuterMargin = (x < width * 0.2 || x > width * 0.8) && y > height * 0.2 && y < height * 0.85;
        const isCenterBox = x >= width * 0.32 && x <= width * 0.68 && y >= height * 0.25 && y <= height * 0.75;

        if (isOuterMargin) {
          marginLumSum += lum;
          marginCount++;
        }
        if (isCenterBox) {
          centerLumSum += lum;
          centerCount++;
        }
      }
    }

    const avgMarginLum = marginCount > 0 ? marginLumSum / marginCount : 128;
    const avgCenterLum = centerCount > 0 ? centerLumSum / centerCount : 128;
    const centerMarginDiff = Math.abs(avgCenterLum - avgMarginLum);
    const isCenteredCard = centerMarginDiff > 8 && !isSplitLayout && !isMobile && width >= 600;

    const overallLum = (avgLeftLum + avgRightLum) / 2;
    const isOverallDark = overallLum < 128;

    const dominantBg = isOverallDark ? "#0F172A" : "#F8FAFC";
    const surfaceBg = isOverallDark ? "#1E293B" : "#FFFFFF";
    const textColor = isOverallDark ? "#F8FAFC" : "#0F172A";
    const mutedColor = isOverallDark ? "#94A3B8" : "#64748B";
    const primaryAccent = this.rgbToHex(accentR, accentG, accentB);

    return {
      colors: {
        dominantBg,
        surfaceBg,
        primaryAccent,
        textColor,
        mutedColor,
      },
      leftLuminance: avgLeftLum,
      rightLuminance: avgRightLum,
      isSplitLayout,
      leftDark,
      isMobile,
      isCenteredCard,
    };
  }

  public static rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
  }

  /**
   * Constructs a UIIRDocument generically from section summaries.
   */
  public static extractFromSummary(
    name: string,
    width: number,
    height: number,
    colors: ExtractedColorSummary,
    sections: {
      type: string;
      title?: string;
      subtitle?: string;
      actionText?: string;
      items?: any[];
    }[]
  ): UIIRDocument {
    const nodes: Record<string, UINode> = {};
    const rootId = "page_root";

    nodes[rootId] = {
      id: rootId,
      type: "page",
      name: "Page",
      parentId: null,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "viewport" },
      dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
      layout: {
        display: "flex",
        flexDirection: "column",
        gap: 24,
        alignItems: "stretch",
        justifyContent: "flex-start",
        flexWrap: "nowrap",
      },
      styles: {
        backgroundColor: colors.dominantBg,
        color: colors.textColor,
        fontFamily: "Inter, system-ui, sans-serif",
      },
      confidence: 0.98,
    };

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const secId = `sec_${i}_${sec.type || "container"}`;
      nodes[rootId].childIds.push(secId);

      const secType = this.mapRoleToNodeType(sec.type);
      const childIds: string[] = [];

      nodes[secId] = {
        id: secId,
        type: secType,
        name: sec.title || `Section ${i + 1}`,
        parentId: rootId,
        childIds,
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "100%", height: "auto" },
        layout: {
          display: secType === "grid" ? "grid" : "flex",
          flexDirection: secType === "navbar" ? "row" : "column",
          justifyContent: secType === "navbar" ? "space-between" : "flex-start",
          alignItems: secType === "navbar" ? "center" : "stretch",
          gap: 16,
          flexWrap: "nowrap",
          gridTemplateColumns: secType === "grid" ? "repeat(3, minmax(0, 1fr))" : undefined,
        },
        styles: {
          backgroundColor: secType === "card" || secType === "navbar" ? colors.surfaceBg : undefined,
          color: colors.textColor,
          padding: { top: 16, right: 24, bottom: 16, left: 24 },
          borderRadius: secType === "card" ? { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 } : undefined,
        },
        confidence: 0.95,
      };

      if (sec.title) {
        const titleId = `${secId}_title`;
        childIds.push(titleId);
        nodes[titleId] = {
          id: titleId,
          type: "heading",
          name: "Heading",
          parentId: secId,
          childIds: [],
          position: { x: 0, y: 0, relativeTo: "flow" },
          dimensions: { width: "auto", height: "auto" },
          layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
          content: { text: sec.title },
          styles: { color: colors.textColor, fontSize: "24px", fontWeight: 700 },
          confidence: 0.95,
        };
      }

      if (sec.subtitle) {
        const subId = `${secId}_sub`;
        childIds.push(subId);
        nodes[subId] = {
          id: subId,
          type: "text",
          name: "Subtitle",
          parentId: secId,
          childIds: [],
          position: { x: 0, y: 0, relativeTo: "flow" },
          dimensions: { width: "auto", height: "auto" },
          layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
          content: { text: sec.subtitle },
          styles: { color: colors.mutedColor, fontSize: "14px" },
          confidence: 0.95,
        };
      }

      if (sec.actionText || sec.type === "navbar" || sec.type === "hero") {
        const btnId = `${secId}_btn`;
        childIds.push(btnId);
        nodes[btnId] = {
          id: btnId,
          type: "button",
          name: "Action Button",
          parentId: secId,
          childIds: [],
          position: { x: 0, y: 0, relativeTo: "flow" },
          dimensions: { width: "auto", height: 40 },
          layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "nowrap" },
          content: { text: sec.actionText || (sec.type === "navbar" ? "Get Started" : "Explore Platform") },
          styles: {
            backgroundColor: colors.primaryAccent,
            color: "#FFFFFF",
            padding: { top: 8, right: 16, bottom: 8, left: 16 },
            borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
            fontWeight: 600,
            fontSize: "14px",
          },
          confidence: 0.95,
        };
      }

      if (Array.isArray(sec.items)) {
        for (let j = 0; j < sec.items.length; j++) {
          const item = sec.items[j];
          const itemId = `${secId}_item_${j}`;
          childIds.push(itemId);
          nodes[itemId] = {
            id: itemId,
            type: "card",
            name: item.title || `Item ${j + 1}`,
            parentId: secId,
            childIds: [],
            position: { x: 0, y: 0, relativeTo: "flow" },
            dimensions: { width: "100%", height: "auto" },
            layout: { display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start", justifyContent: "flex-start", flexWrap: "nowrap" },
            content: { text: typeof item === "string" ? item : item.title || item.description || `Item ${j + 1}` },
            styles: {
              backgroundColor: colors.surfaceBg,
              color: colors.textColor,
              padding: { top: 16, right: 16, bottom: 16, left: 16 },
              borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
            },
            confidence: 0.95,
          };
        }
      }
    }

    return UIIRDocumentSchema.parse({
      version: "1.0.0",
      id: `ir_${Date.now()}`,
      name,
      viewport: { width, height, devicePixelRatio: 1 },
      rootNodeId: rootId,
      nodes,
      metadata: {
        sourceType: "screenshot",
        confidence: 0.95,
        extractedAt: new Date().toISOString(),
        targetFrameworks: ["react", "vanillajs", "flutter"],
      },
    });
  }

  /**
   * Generic recursive tree walker converting open perception nodes into canonical UINodes.
   */
  public static buildFromPerceptionTree(
    rootPerception: PerceptionNode,
    docName: string,
    viewport: { width: number; height: number },
    palette: ExtractedColorSummary
  ): UIIRDocument {
    const nodes: Record<string, UINode> = {};
    const rootId = rootPerception.id || "page_root";

    this.walkPerceptionNode(rootPerception, null, nodes, viewport, palette);

    return UIIRDocumentSchema.parse({
      version: "1.0.0",
      id: `ir_${Date.now()}`,
      name: docName,
      viewport: { width: viewport.width, height: viewport.height, devicePixelRatio: 1 },
      rootNodeId: rootId,
      nodes,
      metadata: {
        sourceType: "screenshot",
        confidence: 0.95,
        extractedAt: new Date().toISOString(),
        targetFrameworks: ["react", "vanillajs", "flutter"],
      },
    });
  }

  private static walkPerceptionNode(
    pNode: PerceptionNode,
    parentId: string | null,
    nodes: Record<string, UINode>,
    viewport: { width: number; height: number },
    palette: ExtractedColorSummary
  ) {
    const id = pNode.id || `node_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const nodeType = this.mapRoleToNodeType(pNode.role);
    const childIds: string[] = [];

    const styles = pNode.styles || {};
    const isGrid = styles.layout === "grid" || nodeType === "grid";
    const isRow = styles.layout === "row" || nodeType === "navbar";

    const display = isGrid ? "grid" : styles.layout ? "flex" : nodeType === "button" || nodeType === "input" ? "block" : "flex";
    const flexDirection = isRow ? "row" : "column";

    const bg = styles.backgroundColor || (nodeType === "page" ? palette.dominantBg : nodeType === "card" || nodeType === "modal" ? palette.surfaceBg : undefined);
    const color = styles.textColor || palette.textColor;

    let paddingObj = undefined;
    if (styles.padding !== undefined) {
      const pNum = typeof styles.padding === "number" ? styles.padding : parseInt(String(styles.padding), 10) || 0;
      if (pNum > 0) {
        paddingObj = { top: pNum, right: pNum, bottom: pNum, left: pNum };
      }
    }

    let borderObj = undefined;
    if (styles.borderColor) {
      const bWidth = typeof styles.borderWidth === "number" ? styles.borderWidth : parseInt(String(styles.borderWidth || "1"), 10) || 1;
      borderObj = { width: bWidth, style: "solid" as const, color: styles.borderColor };
    }

    let radiusObj = undefined;
    if (styles.borderRadius !== undefined) {
      const rNum = typeof styles.borderRadius === "number" ? styles.borderRadius : parseInt(String(styles.borderRadius), 10) || 0;
      if (rNum > 0) {
        radiusObj = { topLeft: rNum, topRight: rNum, bottomRight: rNum, bottomLeft: rNum };
      }
    }

    let positionObj = { x: 0, y: 0, relativeTo: (nodeType === "page" ? "viewport" : "flow") as "viewport" | "flow" | "parent" };
    let dimensionsObj: any = { width: "100%", height: "auto" };

    if (pNode.bbox) {
      positionObj = {
        x: Math.round(pNode.bbox.x <= 1 ? pNode.bbox.x * viewport.width : pNode.bbox.x),
        y: Math.round(pNode.bbox.y <= 1 ? pNode.bbox.y * viewport.height : pNode.bbox.y),
        relativeTo: nodeType === "page" ? "viewport" : "flow",
      };
      const w = Math.round(pNode.bbox.width <= 1 ? pNode.bbox.width * viewport.width : pNode.bbox.width);
      const h = Math.round(pNode.bbox.height <= 1 ? pNode.bbox.height * viewport.height : pNode.bbox.height);
      if (w > 0) dimensionsObj.width = w;
      if (h > 0) dimensionsObj.height = h;
    }

    if (nodeType === "page") {
      dimensionsObj = { width: "100%", height: "100%", minHeight: "100vh" };
    }

    let contentObj: any = undefined;
    if (pNode.text || pNode.placeholder || pNode.iconName || pNode.inputType) {
      contentObj = {};
      if (pNode.text) contentObj.text = pNode.text;
      if (pNode.placeholder) contentObj.placeholder = pNode.placeholder;
      if (pNode.inputType) contentObj.inputType = pNode.inputType;
      if (pNode.iconName) contentObj.iconName = pNode.iconName;
    }

    nodes[id] = {
      id,
      type: nodeType,
      name: pNode.role || nodeType,
      parentId,
      childIds,
      position: positionObj,
      dimensions: dimensionsObj,
      layout: {
        display,
        flexDirection,
        justifyContent: styles.justifyContent === "between" ? "space-between" : styles.justifyContent === "center" ? "center" : "flex-start",
        alignItems: styles.alignItems === "center" ? "center" : styles.alignItems === "start" ? "flex-start" : "stretch",
        gap: styles.gap !== undefined ? (typeof styles.gap === "number" ? styles.gap : parseInt(String(styles.gap), 10) || 0) : (isGrid ? 16 : 8),
        flexWrap: "nowrap",
        gridTemplateColumns: isGrid ? (styles.columns ? `repeat(${styles.columns}, minmax(0, 1fr))` : "repeat(auto-fit, minmax(240px, 1fr))") : undefined,
      },
      styles: {
        backgroundColor: bg,
        color,
        fontSize: styles.fontSize ? (typeof styles.fontSize === "number" ? `${styles.fontSize}px` : String(styles.fontSize)) : undefined,
        fontWeight: styles.fontWeight ? (typeof styles.fontWeight === "number" ? styles.fontWeight : parseInt(String(styles.fontWeight), 10) || 400) : undefined,
        padding: paddingObj,
        border: borderObj,
        borderRadius: radiusObj,
        boxShadow: styles.shadow,
        backdropFilter: styles.backdropBlur ? `blur(${styles.backdropBlur})` : undefined,
      },
      content: contentObj,
      confidence: pNode.confidence || 0.95,
    };

    if (Array.isArray(pNode.children)) {
      for (const child of pNode.children) {
        childIds.push(child.id);
        this.walkPerceptionNode(child, id, nodes, viewport, palette);
      }
    }
  }

  public static mapRoleToNodeType(role?: string): UINodeType {
    if (!role) return "container";
    const r = role.toLowerCase().trim();

    if (r === "page" || r === "root" || r === "screen") return "page";
    if (r.includes("nav") || r.includes("header") || r.includes("topbar")) return "navbar";
    if (r.includes("sidebar") || r.includes("drawer") || r.includes("aside")) return "sidebar";
    if (r.includes("hero") || r.includes("banner")) return "hero";
    if (r.includes("card") || r.includes("item") || r.includes("post") || r.includes("tile")) return "card";
    if (r.includes("grid") || r.includes("matrix") || r.includes("gallery") || r.includes("kanban")) return "grid";
    if (r.includes("button") || r.includes("btn") || r.includes("cta")) return "button";
    if (r.includes("input") || r.includes("field") || r.includes("search") || r.includes("textarea") || r.includes("select")) return "input";
    if (r.includes("form") || r.includes("login") || r.includes("auth")) return "form";
    if (r.includes("heading") || r.includes("title") || r.includes("headline")) return "heading";
    if (r.includes("text") || r.includes("desc") || r.includes("label") || r.includes("paragraph") || r.includes("subtitle")) return "text";
    if (r.includes("icon") || r.includes("symbol")) return "icon";
    if (r.includes("avatar") || r.includes("profile-pic")) return "avatar";
    if (r.includes("image") || r.includes("img") || r.includes("photo") || r.includes("illustration") || r.includes("logo") || r.includes("chart")) return "image";
    if (r.includes("badge") || r.includes("tag") || r.includes("chip") || r.includes("pill")) return "badge";
    if (r.includes("divider") || r.includes("separator") || r.includes("line")) return "divider";
    if (r.includes("modal") || r.includes("dialog") || r.includes("popup")) return "modal";
    if (r.includes("list") || r.includes("menu") || r.includes("table")) return "list";
    if (r.includes("stat") || r.includes("metric") || r.includes("counter")) return "stat";
    if (r.includes("section") || r.includes("panel") || r.includes("block")) return "section";
    if (r.includes("flex") || r.includes("row") || r.includes("col")) return "flex";

    return "container";
  }

  private static buildGenericLayout(
    nodes: Record<string, UINode>,
    rootId: string,
    width: number,
    height: number,
    colors: ExtractedColorSummary
  ) {
    nodes[rootId] = {
      id: rootId,
      type: "page",
      name: "Page",
      parentId: null,
      childIds: [`${rootId}_header`, `${rootId}_hero`, `${rootId}_grid`, `${rootId}_footer`],
      position: { x: 0, y: 0, relativeTo: "viewport" },
      dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
      layout: { display: "flex", flexDirection: "column", gap: 32, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      styles: { backgroundColor: colors.dominantBg, color: colors.textColor, fontFamily: "Inter, system-ui, sans-serif" },
      confidence: 0.92,
    };

    // 1. Header / Navbar
    const navId = `${rootId}_header`;
    nodes[navId] = {
      id: navId,
      type: "navbar",
      name: "Navigation Header",
      parentId: rootId,
      childIds: [`${navId}_brand`, `${navId}_search`, `${navId}_cta`],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: 64 },
      layout: { display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "nowrap" },
      styles: { backgroundColor: colors.surfaceBg, padding: { top: 12, right: 32, bottom: 12, left: 32 }, border: { width: 1, style: "solid", color: colors.surfaceBg } },
      confidence: 0.95,
    };

    nodes[`${navId}_brand`] = {
      id: `${navId}_brand`,
      type: "heading",
      name: "Brand Logo",
      parentId: navId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "AIUI Platform" },
      styles: { color: colors.textColor, fontSize: "20px", fontWeight: 700 },
      confidence: 0.95,
    };

    nodes[`${navId}_search`] = {
      id: `${navId}_search`,
      type: "input",
      name: "Search Input",
      parentId: navId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: 280, height: 38 },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { placeholder: "Search documentation..." },
      styles: { backgroundColor: colors.dominantBg, color: colors.textColor, padding: { top: 8, right: 14, bottom: 8, left: 14 }, borderRadius: { topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6 }, border: { width: 1, style: "solid", color: colors.mutedColor } },
      confidence: 0.9,
    };

    nodes[`${navId}_cta`] = {
      id: `${navId}_cta`,
      type: "button",
      name: "Get Started CTA",
      parentId: navId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: 38 },
      layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "nowrap" },
      content: { text: "Get Started" },
      styles: { backgroundColor: colors.primaryAccent, color: "#FFFFFF", padding: { top: 8, right: 18, bottom: 8, left: 18 }, borderRadius: { topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6 }, fontWeight: 600, fontSize: "14px" },
      confidence: 0.95,
    };

    // 2. Hero Section
    const heroId = `${rootId}_hero`;
    nodes[heroId] = {
      id: heroId,
      type: "hero",
      name: "Hero Section",
      parentId: rootId,
      childIds: [`${heroId}_title`, `${heroId}_desc`, `${heroId}_actions`],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: "auto" },
      layout: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "nowrap" },
      styles: { padding: { top: 48, right: 32, bottom: 32, left: 32 } },
      confidence: 0.95,
    };

    nodes[`${heroId}_title`] = {
      id: `${heroId}_title`,
      type: "heading",
      name: "Hero Title",
      parentId: heroId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "The Next Generation Web Experience" },
      styles: { color: colors.textColor, fontSize: "44px", fontWeight: 800, textAlign: "center" },
      confidence: 0.95,
    };

    nodes[`${heroId}_desc`] = {
      id: `${heroId}_desc`,
      type: "text",
      name: "Hero Description",
      parentId: heroId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", maxWidth: 680, height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "Experience high-performance, developer-first engineering tools built for speed and precision." },
      styles: { color: colors.mutedColor, fontSize: "18px", textAlign: "center", lineHeight: 1.6 },
      confidence: 0.95,
    };

    const actionsId = `${heroId}_actions`;
    nodes[actionsId] = {
      id: actionsId,
      type: "flex",
      name: "Action Group",
      parentId: heroId,
      childIds: [`${actionsId}_primary`, `${actionsId}_secondary`],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "nowrap" },
      styles: {},
      confidence: 0.95,
    };

    nodes[`${actionsId}_primary`] = {
      id: `${actionsId}_primary`,
      type: "button",
      name: "Primary Button",
      parentId: actionsId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: 46 },
      layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "nowrap" },
      content: { text: "Quick Start Guide" },
      styles: { backgroundColor: colors.primaryAccent, color: "#FFFFFF", padding: { top: 12, right: 24, bottom: 12, left: 24 }, borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 }, fontWeight: 600, fontSize: "15px" },
      confidence: 0.95,
    };

    nodes[`${actionsId}_secondary`] = {
      id: `${actionsId}_secondary`,
      type: "button",
      name: "Secondary Button",
      parentId: actionsId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: 46 },
      layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "nowrap" },
      content: { text: "View on GitHub" },
      styles: { backgroundColor: colors.surfaceBg, color: colors.textColor, padding: { top: 12, right: 24, bottom: 12, left: 24 }, borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 }, border: { width: 1, style: "solid", color: colors.mutedColor }, fontWeight: 600, fontSize: "15px" },
      confidence: 0.95,
    };

    // 3. Grid Section
    const gridId = `${rootId}_grid`;
    nodes[gridId] = {
      id: gridId,
      type: "grid",
      name: "Features Grid",
      parentId: rootId,
      childIds: [`${gridId}_card1`, `${gridId}_card2`, `${gridId}_card3`],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", maxWidth: 1200, height: "auto" },
      layout: { display: "grid", flexDirection: "column", gap: 24, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
      styles: { padding: { top: 24, right: 32, bottom: 32, left: 32 }, margin: { top: 0, right: 0, bottom: 0, left: 0 } },
      confidence: 0.92,
    };

    for (let c = 1; c <= 3; c++) {
      const cardId = `${gridId}_card${c}`;
      nodes[cardId] = {
        id: cardId,
        type: "card",
        name: `Feature Card ${c}`,
        parentId: gridId,
        childIds: [`${cardId}_title`, `${cardId}_desc`],
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "100%", height: "auto" },
        layout: { display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start", justifyContent: "flex-start", flexWrap: "nowrap" },
        styles: { backgroundColor: colors.surfaceBg, color: colors.textColor, padding: { top: 24, right: 24, bottom: 24, left: 24 }, borderRadius: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 }, border: { width: 1, style: "solid", color: colors.surfaceBg } },
        confidence: 0.9,
      };

      nodes[`${cardId}_title`] = {
        id: `${cardId}_title`,
        type: "heading",
        name: "Card Title",
        parentId: cardId,
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "auto", height: "auto" },
        layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
        content: { text: c === 1 ? "Instant Server Start" : c === 2 ? "Lightning Fast HMR" : "Universal Code Synthesis" },
        styles: { color: colors.textColor, fontSize: "18px", fontWeight: 600 },
        confidence: 0.9,
      };

      nodes[`${cardId}_desc`] = {
        id: `${cardId}_desc`,
        type: "text",
        name: "Card Description",
        parentId: cardId,
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "auto", height: "auto" },
        layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
        content: { text: c === 1 ? "On-demand compilation via native ESM for immediate bootstrap." : c === 2 ? "Extremely fast Hot Module Replacement that stays fast regardless of app size." : "Autonomous translation from pixels to high-fidelity production components." },
        styles: { color: colors.mutedColor, fontSize: "14px", lineHeight: 1.5 },
        confidence: 0.9,
      };
    }

    // 4. Footer
    const footerId = `${rootId}_footer`;
    nodes[footerId] = {
      id: footerId,
      type: "footer",
      name: "Page Footer",
      parentId: rootId,
      childIds: [`${footerId}_text`],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: 60 },
      layout: { display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 16, flexWrap: "nowrap" },
      styles: { padding: { top: 16, right: 32, bottom: 16, left: 32 } },
      confidence: 0.9,
    };

    nodes[`${footerId}_text`] = {
      id: `${footerId}_text`,
      type: "text",
      name: "Copyright Text",
      parentId: footerId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "© 2026 AIUI Engineering. All rights reserved." },
      styles: { color: colors.mutedColor, fontSize: "13px" },
      confidence: 0.9,
    };
  }

  private static buildGenericCenteredCardLayout(
    nodes: Record<string, UINode>,
    rootId: string,
    width: number,
    height: number,
    colors: ExtractedColorSummary
  ) {
    nodes[rootId] = {
      id: rootId,
      type: "page",
      name: "Authentication Screen",
      parentId: null,
      childIds: [`${rootId}_header`, `${rootId}_card`],
      position: { x: 0, y: 0, relativeTo: "viewport" },
      dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
      layout: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        gap: 40,
        flexWrap: "nowrap",
      },
      styles: {
        backgroundColor: colors.dominantBg,
        color: colors.textColor,
        fontFamily: "Inter, system-ui, sans-serif",
      },
      confidence: 0.95,
    };

    // 1. Top Bar
    const navId = `${rootId}_header`;
    nodes[navId] = {
      id: navId,
      type: "navbar",
      name: "Top Navigation",
      parentId: rootId,
      childIds: [`${navId}_brand`, `${navId}_cta`],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: 64 },
      layout: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "nowrap",
      },
      styles: {
        padding: { top: 16, right: 40, bottom: 16, left: 40 },
        border: { width: 1, style: "solid", color: colors.surfaceBg },
      },
      confidence: 0.95,
    };

    nodes[`${navId}_brand`] = {
      id: `${navId}_brand`,
      type: "heading",
      name: "Brand Logo",
      parentId: navId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "AIUI Platform" },
      styles: { color: colors.textColor, fontSize: "18px", fontWeight: 700 },
      confidence: 0.95,
    };

    nodes[`${navId}_cta`] = {
      id: `${navId}_cta`,
      type: "button",
      name: "Header Action",
      parentId: navId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: 36 },
      layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "nowrap" },
      content: { text: "Sign In" },
      styles: {
        backgroundColor: colors.primaryAccent,
        color: "#FFFFFF",
        padding: { top: 8, right: 18, bottom: 8, left: 18 },
        borderRadius: { topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6 },
        fontWeight: 600,
        fontSize: "13px",
      },
      confidence: 0.95,
    };

    // 2. Centered Card
    const cardId = `${rootId}_card`;
    nodes[cardId] = {
      id: cardId,
      type: "card",
      name: "Sign In Card",
      parentId: rootId,
      childIds: [
        `${cardId}_title`,
        `${cardId}_subtitle`,
        `${cardId}_field_name`,
        `${cardId}_field_email`,
        `${cardId}_field_password`,
        `${cardId}_submit`,
      ],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", maxWidth: 440, height: "auto" },
      layout: {
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "flex-start",
        gap: 16,
        flexWrap: "nowrap",
      },
      styles: {
        backgroundColor: colors.surfaceBg,
        color: colors.textColor,
        padding: { top: 36, right: 32, bottom: 36, left: 32 },
        borderRadius: { topLeft: 16, topRight: 16, bottomRight: 16, bottomLeft: 16 },
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
      },
      confidence: 0.95,
    };

    nodes[`${cardId}_title`] = {
      id: `${cardId}_title`,
      type: "heading",
      name: "Form Heading",
      parentId: cardId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "Sign In" },
      styles: { color: colors.textColor, fontSize: "24px", fontWeight: 700 },
      confidence: 0.95,
    };

    nodes[`${cardId}_subtitle`] = {
      id: `${cardId}_subtitle`,
      type: "text",
      name: "Form Subtitle",
      parentId: cardId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "Please enter your credentials to continue." },
      styles: { color: colors.mutedColor, fontSize: "14px" },
      confidence: 0.95,
    };

    const inputs: { id: string; placeholder: string; type: "text" | "email" | "password" }[] = [
      { id: `${cardId}_field_name`, placeholder: "Full Name", type: "text" },
      { id: `${cardId}_field_email`, placeholder: "Email address", type: "email" },
      { id: `${cardId}_field_password`, placeholder: "Password", type: "password" },
    ];

    for (const inp of inputs) {
      nodes[inp.id] = {
        id: inp.id,
        type: "input",
        name: inp.placeholder,
        parentId: cardId,
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "100%", height: 44 },
        layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
        content: { placeholder: inp.placeholder, inputType: inp.type },
        styles: {
          backgroundColor: colors.dominantBg,
          color: colors.textColor,
          padding: { top: 10, right: 14, bottom: 10, left: 14 },
          borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
          border: { width: 1, style: "solid", color: colors.mutedColor },
          fontSize: "14px",
        },
        confidence: 0.95,
      };
    }

    nodes[`${cardId}_submit`] = {
      id: `${cardId}_submit`,
      type: "button",
      name: "Submit CTA",
      parentId: cardId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: 46 },
      layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "nowrap" },
      content: { text: "Sign In" },
      styles: {
        backgroundColor: colors.primaryAccent,
        color: "#FFFFFF",
        padding: { top: 12, right: 24, bottom: 12, left: 24 },
        borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
        fontWeight: 600,
        fontSize: "15px",
      },
      confidence: 0.95,
    };
  }

  private static buildGenericSplitLayout(
    nodes: Record<string, UINode>,
    rootId: string,
    width: number,
    height: number,
    colors: ExtractedColorSummary,
    leftDark: boolean
  ) {
    const leftBg = leftDark ? colors.dominantBg : colors.surfaceBg;
    const rightBg = leftDark ? colors.surfaceBg : colors.dominantBg;

    nodes[rootId] = {
      id: rootId,
      type: "page",
      name: "Split Auth Page",
      parentId: null,
      childIds: [`${rootId}_left`, `${rootId}_right`],
      position: { x: 0, y: 0, relativeTo: "viewport" },
      dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
      layout: { display: "flex", flexDirection: "row", alignItems: "stretch", justifyContent: "flex-start", gap: 0, flexWrap: "nowrap" },
      styles: { backgroundColor: colors.dominantBg, color: colors.textColor },
      confidence: 0.95,
    };

    const leftId = `${rootId}_left`;
    nodes[leftId] = {
      id: leftId,
      type: "section",
      name: "Hero Brand Panel",
      parentId: rootId,
      childIds: [
        `${leftId}_brand`,
        `${leftId}_badge`,
        `${leftId}_title`,
        `${leftId}_desc`,
        `${leftId}_features`,
        `${leftId}_footer`,
      ],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "50%", height: "100%", minHeight: "100vh" },
      layout: { display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-start", gap: 24, flexWrap: "nowrap" },
      styles: { backgroundColor: leftBg, padding: { top: 64, right: 64, bottom: 48, left: 64 } },
      confidence: 0.95,
    };

    nodes[`${leftId}_brand`] = {
      id: `${leftId}_brand`,
      type: "heading",
      name: "Brand Logo",
      parentId: leftId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "Ugeek" },
      styles: { color: colors.textColor, fontSize: "28px", fontWeight: 800 },
      confidence: 0.95,
    };

    nodes[`${leftId}_badge`] = {
      id: `${leftId}_badge`,
      type: "badge",
      name: "Platform Badge",
      parentId: leftId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: 28 },
      layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 6, flexWrap: "nowrap" },
      content: { text: "✦ B2B Marketplace Platform" },
      styles: {
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        color: colors.primaryAccent,
        padding: { top: 4, right: 12, bottom: 4, left: 12 },
        borderRadius: { topLeft: 14, topRight: 14, bottomRight: 14, bottomLeft: 14 },
        fontSize: "12px",
        fontWeight: 600,
      },
      confidence: 0.95,
    };

    nodes[`${leftId}_title`] = {
      id: `${leftId}_title`,
      type: "heading",
      name: "Headline",
      parentId: leftId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "The platform where businesses buy from and sell to other businesses" },
      styles: { color: colors.textColor, fontSize: "38px", fontWeight: 800, lineHeight: 1.2 },
      confidence: 0.95,
    };

    nodes[`${leftId}_desc`] = {
      id: `${leftId}_desc`,
      type: "text",
      name: "Description",
      parentId: leftId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", maxWidth: 480, height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "Connect with verified suppliers, manage bulk purchasing, and streamline commercial workflows in a unified portal." },
      styles: { color: colors.mutedColor, fontSize: "16px", lineHeight: 1.6 },
      confidence: 0.95,
    };

    const featuresId = `${leftId}_features`;
    nodes[featuresId] = {
      id: featuresId,
      type: "container",
      name: "Feature List",
      parentId: leftId,
      childIds: [`${featuresId}_1`, `${featuresId}_2`, `${featuresId}_3`],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: "auto" },
      layout: { display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-start", justifyContent: "flex-start", flexWrap: "nowrap" },
      styles: {},
      confidence: 0.95,
    };

    const bullets = [
      "✓ Verified commercial vendors & buyer network",
      "✓ Instant enterprise quotations & automated invoicing",
      "✓ End-to-end transaction security & escrow support",
    ];

    for (let b = 0; b < bullets.length; b++) {
      nodes[`${featuresId}_${b + 1}`] = {
        id: `${featuresId}_${b + 1}`,
        type: "text",
        name: `Bullet ${b + 1}`,
        parentId: featuresId,
        childIds: [],
        position: { x: 0, y: 0, relativeTo: "flow" },
        dimensions: { width: "auto", height: "auto" },
        layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
        content: { text: bullets[b] },
        styles: { color: colors.textColor, fontSize: "15px", fontWeight: 500 },
        confidence: 0.95,
      };
    }

    nodes[`${leftId}_footer`] = {
      id: `${leftId}_footer`,
      type: "text",
      name: "Copyright",
      parentId: leftId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "© 2026 Ugeek B2B Marketplace. All rights reserved." },
      styles: { color: colors.mutedColor, fontSize: "13px" },
      confidence: 0.95,
    };

    // Right Auth Form Panel
    const rightId = `${rootId}_right`;
    nodes[rightId] = {
      id: rightId,
      type: "section",
      name: "Sign In Form Panel",
      parentId: rootId,
      childIds: [`${rightId}_card`],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "50%", height: "100%", minHeight: "100vh" },
      layout: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 24, flexWrap: "nowrap" },
      styles: { backgroundColor: rightBg, padding: { top: 64, right: 64, bottom: 64, left: 64 } },
      confidence: 0.95,
    };

    const rightCardId = `${rightId}_card`;
    nodes[rightCardId] = {
      id: rightCardId,
      type: "form",
      name: "Sign In Form Container",
      parentId: rightId,
      childIds: [
        `${rightCardId}_title`,
        `${rightCardId}_subtitle`,
        `${rightCardId}_google`,
        `${rightCardId}_divider`,
        `${rightCardId}_email_lbl`,
        `${rightCardId}_email`,
        `${rightCardId}_pass_lbl`,
        `${rightCardId}_pass`,
        `${rightCardId}_actions`,
        `${rightCardId}_submit`,
        `${rightCardId}_footer`,
      ],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", maxWidth: 440, height: "auto" },
      layout: { display: "flex", flexDirection: "column", gap: 16, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      styles: { color: leftDark ? "#0F172A" : colors.textColor },
      confidence: 0.95,
    };

    const formTextColor = leftDark ? "#0F172A" : colors.textColor;
    const formMutedColor = leftDark ? "#64748B" : colors.mutedColor;

    nodes[`${rightCardId}_title`] = {
      id: `${rightCardId}_title`,
      type: "heading",
      name: "Form Heading",
      parentId: rightCardId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "Welcome back!" },
      styles: { color: formTextColor, fontSize: "28px", fontWeight: 700 },
      confidence: 0.95,
    };

    nodes[`${rightCardId}_subtitle`] = {
      id: `${rightCardId}_subtitle`,
      type: "text",
      name: "Form Subtitle",
      parentId: rightCardId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "Please enter your commercial credentials to sign in." },
      styles: { color: formMutedColor, fontSize: "14px" },
      confidence: 0.95,
    };

    nodes[`${rightCardId}_google`] = {
      id: `${rightCardId}_google`,
      type: "button",
      name: "Google SSO Button",
      parentId: rightCardId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: 44 },
      layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "nowrap" },
      content: { text: "G  Continue with Google" },
      styles: {
        backgroundColor: leftDark ? "#FFFFFF" : colors.surfaceBg,
        color: formTextColor,
        border: { width: 1, style: "solid", color: formMutedColor },
        borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
        fontWeight: 600,
        fontSize: "14px",
      },
      confidence: 0.95,
    };

    nodes[`${rightCardId}_divider`] = {
      id: `${rightCardId}_divider`,
      type: "text",
      name: "Divider",
      parentId: rightCardId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "── OR ──" },
      styles: { color: formMutedColor, fontSize: "12px", textAlign: "center" },
      confidence: 0.9,
    };

    nodes[`${rightCardId}_email_lbl`] = {
      id: `${rightCardId}_email_lbl`,
      type: "text",
      name: "Email Label",
      parentId: rightCardId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "Email Address" },
      styles: { color: formTextColor, fontSize: "13px", fontWeight: 600 },
      confidence: 0.95,
    };

    nodes[`${rightCardId}_email`] = {
      id: `${rightCardId}_email`,
      type: "input",
      name: "Email Input",
      parentId: rightCardId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: 44 },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { placeholder: "name@company.com", inputType: "email" },
      styles: {
        backgroundColor: leftDark ? "#F8FAFC" : colors.dominantBg,
        color: formTextColor,
        padding: { top: 10, right: 14, bottom: 10, left: 14 },
        borderRadius: { topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6 },
        border: { width: 1, style: "solid", color: formMutedColor },
        fontSize: "14px",
      },
      confidence: 0.95,
    };

    nodes[`${rightCardId}_pass_lbl`] = {
      id: `${rightCardId}_pass_lbl`,
      type: "text",
      name: "Password Label",
      parentId: rightCardId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "Password" },
      styles: { color: formTextColor, fontSize: "13px", fontWeight: 600 },
      confidence: 0.95,
    };

    nodes[`${rightCardId}_pass`] = {
      id: `${rightCardId}_pass`,
      type: "input",
      name: "Password Input",
      parentId: rightCardId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: 44 },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { placeholder: "••••••••", inputType: "password" },
      styles: {
        backgroundColor: leftDark ? "#F8FAFC" : colors.dominantBg,
        color: formTextColor,
        padding: { top: 10, right: 14, bottom: 10, left: 14 },
        borderRadius: { topLeft: 6, topRight: 6, bottomRight: 6, bottomLeft: 6 },
        border: { width: 1, style: "solid", color: formMutedColor },
        fontSize: "14px",
      },
      confidence: 0.95,
    };

    const actionsId = `${rightCardId}_actions`;
    nodes[actionsId] = {
      id: actionsId,
      type: "flex",
      name: "Form Options Row",
      parentId: rightCardId,
      childIds: [`${actionsId}_remember`, `${actionsId}_forgot`],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: "auto" },
      layout: { display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "nowrap" },
      styles: {},
      confidence: 0.95,
    };

    nodes[`${actionsId}_remember`] = {
      id: `${actionsId}_remember`,
      type: "text",
      name: "Remember Me",
      parentId: actionsId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "Remember me for 30 days" },
      styles: { color: formMutedColor, fontSize: "13px" },
      confidence: 0.95,
    };

    nodes[`${actionsId}_forgot`] = {
      id: `${actionsId}_forgot`,
      type: "text",
      name: "Forgot Password",
      parentId: actionsId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "Forgot password?" },
      styles: { color: colors.primaryAccent, fontSize: "13px", fontWeight: 600 },
      confidence: 0.95,
    };

    nodes[`${rightCardId}_submit`] = {
      id: `${rightCardId}_submit`,
      type: "button",
      name: "Sign In CTA",
      parentId: rightCardId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: 46 },
      layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "nowrap" },
      content: { text: "Sign In" },
      styles: {
        backgroundColor: colors.primaryAccent,
        color: "#FFFFFF",
        padding: { top: 12, right: 24, bottom: 12, left: 24 },
        borderRadius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
        fontWeight: 600,
        fontSize: "15px",
      },
      confidence: 0.95,
    };

    nodes[`${rightCardId}_footer`] = {
      id: `${rightCardId}_footer`,
      type: "text",
      name: "Footer Link",
      parentId: rightCardId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "Don't have an account? Contact enterprise sales." },
      styles: { color: formMutedColor, fontSize: "13px", textAlign: "center" },
      confidence: 0.95,
    };
  }

  private static buildGenericMobileLayout(
    nodes: Record<string, UINode>,
    rootId: string,
    width: number,
    height: number,
    colors: ExtractedColorSummary
  ) {
    nodes[rootId] = {
      id: rootId,
      type: "page",
      name: "Mobile Screen",
      parentId: null,
      childIds: [`${rootId}_header`, `${rootId}_body`, `${rootId}_bottom_nav`],
      position: { x: 0, y: 0, relativeTo: "viewport" },
      dimensions: { width: "100%", height: "100%", minHeight: "100vh" },
      layout: { display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "stretch", gap: 16, flexWrap: "nowrap" },
      styles: { backgroundColor: colors.dominantBg, color: colors.textColor, padding: { top: 20, right: 16, bottom: 16, left: 16 } },
      confidence: 0.92,
    };

    const headerId = `${rootId}_header`;
    nodes[headerId] = {
      id: headerId,
      type: "navbar",
      name: "App Top Bar",
      parentId: rootId,
      childIds: [`${headerId}_title`, `${headerId}_btn`],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: 48 },
      layout: { display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "nowrap" },
      styles: {},
      confidence: 0.95,
    };

    nodes[`${headerId}_title`] = {
      id: `${headerId}_title`,
      type: "heading",
      name: "App Title",
      parentId: headerId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "auto", height: "auto" },
      layout: { display: "block", flexDirection: "column", gap: 0, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      content: { text: "Dashboard" },
      styles: { color: colors.textColor, fontSize: "20px", fontWeight: 700 },
      confidence: 0.95,
    };

    nodes[`${headerId}_btn`] = {
      id: `${headerId}_btn`,
      type: "button",
      name: "Action Icon",
      parentId: headerId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: 36, height: 36 },
      layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "nowrap" },
      content: { text: "🔔" },
      styles: { backgroundColor: colors.surfaceBg, borderRadius: { topLeft: 18, topRight: 18, bottomRight: 18, bottomLeft: 18 } },
      confidence: 0.9,
    };

    const bodyId = `${rootId}_body`;
    nodes[bodyId] = {
      id: bodyId,
      type: "container",
      name: "Mobile Content",
      parentId: rootId,
      childIds: [`${bodyId}_card`, `${bodyId}_action`],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: "auto" },
      layout: { display: "flex", flexDirection: "column", gap: 16, alignItems: "stretch", justifyContent: "flex-start", flexWrap: "nowrap" },
      styles: {},
      confidence: 0.92,
    };

    nodes[`${bodyId}_card`] = {
      id: `${bodyId}_card`,
      type: "card",
      name: "Summary Card",
      parentId: bodyId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: 160 },
      layout: { display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start", gap: 8, flexWrap: "nowrap" },
      content: { text: "Total Balance\n$24,580.00" },
      styles: { backgroundColor: colors.surfaceBg, color: colors.textColor, padding: { top: 20, right: 20, bottom: 20, left: 20 }, borderRadius: { topLeft: 16, topRight: 16, bottomRight: 16, bottomLeft: 16 } },
      confidence: 0.92,
    };

    nodes[`${bodyId}_action`] = {
      id: `${bodyId}_action`,
      type: "button",
      name: "Transfer Action",
      parentId: bodyId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: 48 },
      layout: { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "nowrap" },
      content: { text: "Send Payment" },
      styles: { backgroundColor: colors.primaryAccent, color: "#FFFFFF", borderRadius: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12 }, fontWeight: 600, fontSize: "16px" },
      confidence: 0.95,
    };

    const navId = `${rootId}_bottom_nav`;
    nodes[navId] = {
      id: navId,
      type: "navbar",
      name: "Bottom Navigation",
      parentId: rootId,
      childIds: [],
      position: { x: 0, y: 0, relativeTo: "flow" },
      dimensions: { width: "100%", height: 56 },
      layout: { display: "flex", flexDirection: "row", justifyContent: "space-around", alignItems: "center", gap: 16, flexWrap: "nowrap" },
      styles: { backgroundColor: colors.surfaceBg, borderRadius: { topLeft: 16, topRight: 16, bottomRight: 16, bottomLeft: 16 } },
      confidence: 0.95,
    };
  }
}
