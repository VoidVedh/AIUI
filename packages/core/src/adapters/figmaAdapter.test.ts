import { describe, it, expect } from "vitest";
import { FigmaInputAdapter, FigmaNode } from "./figmaAdapter.js";
import { UIIRDocumentSchema } from "../types/ir.js";

describe("FigmaInputAdapter Unit & Integration Test Suite", () => {
  const adapter = new FigmaInputAdapter();

  // Real-world Figma REST API response JSON snippet for a modern SaaS Pricing Card Frame
  const realFigmaPricingCardDoc = {
    document: {
      id: "0:0",
      name: "Document",
      type: "DOCUMENT",
      children: [
        {
          id: "0:1",
          name: "Page 1",
          type: "CANVAS",
          children: [
            {
              id: "10:100",
              name: "Pricing Card Frame",
              type: "FRAME",
              absoluteBoundingBox: { x: 100, y: 100, width: 380, height: 560 },
              layoutMode: "VERTICAL",
              itemSpacing: 20,
              paddingTop: 32,
              paddingBottom: 32,
              paddingLeft: 24,
              paddingRight: 24,
              primaryAxisAlignItems: "MIN",
              counterAxisAlignItems: "CENTER",
              cornerRadius: 16,
              fills: [
                {
                  type: "SOLID",
                  visible: true,
                  color: { r: 0.05, g: 0.08, b: 0.15 }, // #0D1426
                },
              ],
              strokes: [
                {
                  type: "SOLID",
                  color: { r: 0.23, g: 0.51, b: 0.96 }, // #3B82F5
                },
              ],
              strokeWeight: 1,
              effects: [
                {
                  type: "DROP_SHADOW",
                  visible: true,
                  radius: 24,
                  offset: { x: 0, y: 8 },
                  color: { r: 0, g: 0, b: 0, a: 0.4 },
                },
              ],
              children: [
                {
                  id: "10:101",
                  name: "Badge Container",
                  type: "FRAME",
                  layoutMode: "HORIZONTAL",
                  paddingTop: 6,
                  paddingBottom: 6,
                  paddingLeft: 12,
                  paddingRight: 12,
                  cornerRadius: 20,
                  fills: [
                    {
                      type: "SOLID",
                      visible: true,
                      color: { r: 0.15, g: 0.38, b: 0.92 }, // #2661EB
                    },
                  ],
                  children: [
                    {
                      id: "10:102",
                      name: "Badge Text",
                      type: "TEXT",
                      characters: "MOST POPULAR",
                      style: {
                        fontFamily: "Inter",
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 1,
                        textAlignHorizontal: "CENTER",
                      },
                    },
                  ],
                },
                {
                  id: "10:103",
                  name: "Plan Heading Title",
                  type: "TEXT",
                  characters: "Enterprise Pro",
                  style: {
                    fontFamily: "Inter",
                    fontSize: 28,
                    fontWeight: 800,
                    lineHeightPx: 36,
                    textAlignHorizontal: "CENTER",
                  },
                },
                {
                  id: "10:104",
                  name: "Price Heading",
                  type: "TEXT",
                  characters: "$99/mo",
                  style: {
                    fontFamily: "Inter",
                    fontSize: 36,
                    fontWeight: 800,
                    textAlignHorizontal: "CENTER",
                  },
                },
                {
                  id: "10:105",
                  name: "Features List Grid",
                  type: "FRAME",
                  layoutMode: "VERTICAL",
                  itemSpacing: 12,
                  children: [
                    {
                      id: "10:106",
                      name: "Feature Item 1 Text",
                      type: "TEXT",
                      characters: "✓ Unlimited Autonomous Runs",
                      style: {
                        fontFamily: "Inter",
                        fontSize: 14,
                        fontWeight: 400,
                      },
                    },
                    {
                      id: "10:107",
                      name: "Feature Item 2 Text",
                      type: "TEXT",
                      characters: "✓ SSIM & PixelMatch Diffing",
                      style: {
                        fontFamily: "Inter",
                        fontSize: 14,
                        fontWeight: 400,
                      },
                    },
                  ],
                },
                {
                  id: "10:108",
                  name: "Get Started CTA Button",
                  type: "FRAME",
                  layoutMode: "HORIZONTAL",
                  primaryAxisAlignItems: "CENTER",
                  counterAxisAlignItems: "CENTER",
                  paddingTop: 12,
                  paddingBottom: 12,
                  paddingLeft: 24,
                  paddingRight: 24,
                  cornerRadius: 8,
                  fills: [
                    {
                      type: "SOLID",
                      visible: true,
                      color: { r: 0.23, g: 0.51, b: 0.96 }, // #3B82F5
                    },
                  ],
                  children: [
                    {
                      id: "10:109",
                      name: "Button Label Text",
                      type: "TEXT",
                      characters: "Start 14-Day Free Trial",
                      style: {
                        fontFamily: "Inter",
                        fontSize: 14,
                        fontWeight: 600,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  };

  it("should parse full Figma REST API JSON tree into a strictly valid UIIRDocument", async () => {
    const irDoc = await adapter.parse({
      type: "figma",
      name: "Enterprise Pricing Card",
      data: JSON.stringify(realFigmaPricingCardDoc),
      viewportHint: { width: 1280, height: 800 },
    });

    // Validate against strict Zod Schema
    const validated = UIIRDocumentSchema.safeParse(irDoc);
    expect(validated.success).toBe(true);

    expect(irDoc.version).toBe("1.0.0");
    expect(irDoc.name).toBe("Enterprise Pricing Card");
    expect(irDoc.metadata.sourceType).toBe("figma");
    expect(irDoc.metadata.confidence).toBe(0.99);
    expect(irDoc.rootNodeId).toBe("page_root");
  });

  it("should accurately translate Figma layout, auto-layout, and flexbox styles", async () => {
    const irDoc = await adapter.parse({
      type: "figma",
      data: realFigmaPricingCardDoc,
    });

    const rootNode = irDoc.nodes[irDoc.rootNodeId];
    expect(rootNode).toBeDefined();
    expect(rootNode.dimensions.width).toBe(380);
    expect(rootNode.dimensions.height).toBe(560);
    expect(rootNode.styles.backgroundColor).toBe("#0D1426");
    expect(rootNode.styles.borderRadius?.topLeft).toBe(16);
    expect(rootNode.styles.border?.color).toBe("#3B82F5");
    expect(rootNode.styles.border?.width).toBe(1);

    // Auto-layout mapping
    expect(rootNode.layout.display).toBe("flex");
    expect(rootNode.layout.flexDirection).toBe("column");
    expect(rootNode.layout.gap).toBe(20);
    expect(rootNode.layout.alignItems).toBe("center");
    expect(rootNode.styles.padding).toEqual({ top: 32, right: 24, bottom: 32, left: 24 });
  });

  it("should resolve semantic node archetypes (button, heading, text, grid, container)", async () => {
    const irDoc = await adapter.parse({
      type: "figma",
      data: realFigmaPricingCardDoc,
    });

    const nodesList = Object.values(irDoc.nodes);

    // Find semantic nodes
    const buttonNode = nodesList.find((n) => n.name === "Get Started CTA Button");
    expect(buttonNode).toBeDefined();
    expect(buttonNode?.type).toBe("button");
    expect(buttonNode?.styles.borderRadius?.topLeft).toBe(8);

    const headingNode = nodesList.find((n) => n.name.includes("Plan Heading Title"));
    expect(headingNode).toBeDefined();
    expect(headingNode?.type).toBe("heading");
    expect(headingNode?.content?.text).toBe("Enterprise Pro");
    expect(headingNode?.styles.fontSize).toBe("28px");
    expect(headingNode?.styles.fontWeight).toBe(800);

    const gridNode = nodesList.find((n) => n.name.includes("Features List Grid"));
    expect(gridNode).toBeDefined();
    expect(gridNode?.type).toBe("grid");

    const textNodes = nodesList.filter((n) => n.type === "text");
    expect(textNodes.length).toBeGreaterThanOrEqual(3);
  });

  it("should handle Buffer inputs and direct object inputs seamlessly", async () => {
    const bufferInput = Buffer.from(JSON.stringify(realFigmaPricingCardDoc), "utf-8");
    const irDoc = await adapter.parse({
      type: "figma",
      data: bufferInput,
    });

    expect(irDoc.rootNodeId).toBe("page_root");
    expect(Object.keys(irDoc.nodes).length).toBe(10);
  });

  it("should throw explicit descriptive error on empty or corrupt Figma data", async () => {
    await expect(adapter.parse({ type: "figma", data: "" })).rejects.toThrow(
      "Invalid input: Figma data is empty or missing."
    );

    await expect(adapter.parse({ type: "figma", data: "{ corrupt json invalid" })).rejects.toThrow(
      "Failed to parse Figma JSON payload"
    );
  });
});
