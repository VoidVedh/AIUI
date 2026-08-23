import { UIIRDocument, UINode, UIIRDocumentSchema } from "../types/ir.js";
import { AdapterInput, InputAdapter } from "./types.js";

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number };
  layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL";
  itemSpacing?: number;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  primaryAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  counterAxisAlignItems?: "MIN" | "CENTER" | "MAX";
  fills?: Array<{ type: string; color?: FigmaColor; opacity?: number; visible?: boolean }>;
  strokes?: Array<{ type: string; color?: FigmaColor; opacity?: number }>;
  strokeWeight?: number;
  cornerRadius?: number;
  characters?: string;
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    letterSpacing?: number;
    lineHeightPx?: number;
    textAlignHorizontal?: string;
  };
  effects?: Array<{
    type: string;
    visible?: boolean;
    radius?: number;
    color?: FigmaColor;
    offset?: { x: number; y: number };
  }>;
}

export class FigmaInputAdapter implements InputAdapter {
  public readonly supportedType = "figma" as const;

  /**
   * Parses a Figma REST API document or node JSON into a canonical UIIRDocument.
   */
  public async parse(input: AdapterInput): Promise<UIIRDocument> {
    if (!input.data) {
      throw new Error("Invalid input: Figma data is empty or missing.");
    }

    let figmaDoc: any;
    if (typeof input.data === "string") {
      try {
        figmaDoc = JSON.parse(input.data);
      } catch (err: any) {
        throw new Error(`Failed to parse Figma JSON payload: ${err.message}`);
      }
    } else if (Buffer.isBuffer(input.data)) {
      try {
        figmaDoc = JSON.parse(input.data.toString("utf-8"));
      } catch (err: any) {
        throw new Error(`Failed to parse Figma buffer JSON: ${err.message}`);
      }
    } else {
      figmaDoc = input.data;
    }

    // Extract root frame or canvas
    const rootNode: FigmaNode = figmaDoc.document?.children?.[0]?.children?.[0] || figmaDoc.nodes?.[Object.keys(figmaDoc.nodes || {})[0]]?.document || figmaDoc;

    if (!rootNode) {
      throw new Error("Could not locate a valid root Frame or Component in Figma document.");
    }

    const nodes: Record<string, UINode> = {};
    const rootId = "page_root";
    const width = rootNode.absoluteBoundingBox?.width || input.viewportHint?.width || 1280;
    const height = rootNode.absoluteBoundingBox?.height || input.viewportHint?.height || 800;

    this.convertFigmaNode(rootNode, rootId, null, nodes);

    return UIIRDocumentSchema.parse({
      version: "1.0.0",
      id: `ir_figma_${Date.now()}`,
      name: input.name || rootNode.name || "Figma Import",
      viewport: { width, height, devicePixelRatio: 1 },
      rootNodeId: rootId,
      nodes,
      metadata: {
        sourceType: "figma",
        confidence: 0.99,
        extractedAt: new Date().toISOString(),
        targetFrameworks: ["react", "vanillajs", "flutter"],
      },
    });
  }

  private convertFigmaNode(
    fNode: FigmaNode,
    irId: string,
    parentId: string | null,
    nodeMap: Record<string, UINode>
  ): void {
    const nodeType = this.resolveNodeType(fNode);
    const childIds: string[] = [];

    if (fNode.children && fNode.children.length > 0) {
      fNode.children.forEach((child, idx) => {
        const childIrId = `${irId}_c${idx}`;
        childIds.push(childIrId);
        this.convertFigmaNode(child, childIrId, irId, nodeMap);
      });
    }

    const bounds = fNode.absoluteBoundingBox || { x: 0, y: 0, width: 0, height: 0 };
    const styles: any = {};

    // Fills
    if (fNode.fills && fNode.fills.length > 0) {
      const visibleFill = fNode.fills.find((f) => f.visible !== false && f.color);
      if (visibleFill && visibleFill.color) {
        styles.backgroundColor = this.figmaColorToHex(visibleFill.color);
      }
    }

    // Strokes / Borders
    if (fNode.strokes && fNode.strokes.length > 0 && fNode.strokeWeight) {
      const visibleStroke = fNode.strokes.find((s) => s.color);
      if (visibleStroke && visibleStroke.color) {
        styles.border = {
          width: fNode.strokeWeight,
          style: "solid",
          color: this.figmaColorToHex(visibleStroke.color),
        };
      }
    }

    // Corner Radius
    if (fNode.cornerRadius) {
      styles.borderRadius = {
        topLeft: fNode.cornerRadius,
        topRight: fNode.cornerRadius,
        bottomRight: fNode.cornerRadius,
        bottomLeft: fNode.cornerRadius,
      };
    }

    // Typography
    if (fNode.style) {
      if (fNode.style.fontFamily) styles.fontFamily = fNode.style.fontFamily;
      if (fNode.style.fontSize) styles.fontSize = `${fNode.style.fontSize}px`;
      if (fNode.style.fontWeight) styles.fontWeight = fNode.style.fontWeight;
      if (fNode.style.letterSpacing) styles.letterSpacing = `${fNode.style.letterSpacing}px`;
      if (fNode.style.lineHeightPx) styles.lineHeight = fNode.style.lineHeightPx / (fNode.style.fontSize || 16);
      if (fNode.style.textAlignHorizontal) {
        styles.textAlign = fNode.style.textAlignHorizontal.toLowerCase();
      }
    }

    // Padding
    if (fNode.paddingTop || fNode.paddingRight || fNode.paddingBottom || fNode.paddingLeft) {
      styles.padding = {
        top: fNode.paddingTop || 0,
        right: fNode.paddingRight || 0,
        bottom: fNode.paddingBottom || 0,
        left: fNode.paddingLeft || 0,
      };
    }

    // Effects (Drop Shadows)
    if (fNode.effects && fNode.effects.length > 0) {
      const shadow = fNode.effects.find((e) => e.type === "DROP_SHADOW" && e.visible !== false);
      if (shadow && shadow.color && shadow.offset) {
        const c = shadow.color;
        const colorStr = `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a ?? 1})`;
        styles.boxShadow = `${shadow.offset.x || 0}px ${shadow.offset.y || 4}px ${shadow.radius || 10}px ${colorStr}`;
      }
    }

    // Layout
    const isFlex = fNode.layoutMode === "HORIZONTAL" || fNode.layoutMode === "VERTICAL";
    const layout: any = {
      display: isFlex ? "flex" : "block",
      flexDirection: fNode.layoutMode === "HORIZONTAL" ? "row" : "column",
      gap: fNode.itemSpacing || 0,
      alignItems: fNode.counterAxisAlignItems === "CENTER" ? "center" : "stretch",
      justifyContent: fNode.primaryAxisAlignItems === "SPACE_BETWEEN" ? "space-between" : fNode.primaryAxisAlignItems === "CENTER" ? "center" : "flex-start",
      flexWrap: "nowrap",
    };

    nodeMap[irId] = {
      id: irId,
      type: nodeType,
      name: fNode.name || "Element",
      parentId,
      childIds,
      position: { x: bounds.x, y: bounds.y, relativeTo: parentId ? "flow" : "viewport" },
      dimensions: {
        width: bounds.width || "auto",
        height: bounds.height || "auto",
      },
      layout,
      styles,
      content: fNode.characters ? { text: fNode.characters } : undefined,
      confidence: 0.99,
    };
  }

  private resolveNodeType(fNode: FigmaNode): any {
    const nameLower = fNode.name.toLowerCase();
    if (fNode.type === "TEXT") {
      if (nameLower.includes("title") || nameLower.includes("heading") || (fNode.style?.fontSize && fNode.style.fontSize >= 24)) {
        return "heading";
      }
      return "text";
    }

    if (nameLower.includes("button") || nameLower.includes("btn") || nameLower.includes("cta")) {
      return "button";
    }
    if (nameLower.includes("nav") || nameLower.includes("header")) {
      return "navbar";
    }
    if (nameLower.includes("side") || nameLower.includes("drawer")) {
      return "sidebar";
    }
    if (nameLower.includes("card")) {
      return "card";
    }
    if (nameLower.includes("input") || nameLower.includes("field")) {
      return "input";
    }
    if (nameLower.includes("grid")) {
      return "grid";
    }

    return "container";
  }

  private figmaColorToHex(c: FigmaColor): string {
    const r = Math.round((c.r || 0) * 255).toString(16).padStart(2, "0");
    const g = Math.round((c.g || 0) * 255).toString(16).padStart(2, "0");
    const b = Math.round((c.b || 0) * 255).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`.toUpperCase();
  }
}
