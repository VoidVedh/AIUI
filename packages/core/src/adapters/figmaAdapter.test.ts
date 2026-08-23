import { describe, it, expect } from "vitest";
import { FigmaInputAdapter, FigmaNode } from "./figmaAdapter.js";
import { UIIRDocumentSchema } from "../types/ir.js";

describe("FigmaInputAdapter Unit & Integration Test Suite", () => {
  const adapter = new FigmaInputAdapter();

  // 1. Real-world Figma REST API response JSON snippet for a modern SaaS Pricing Card Frame
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

  // 2. Figma Document with Rich Text Nodes
  const richTextFigmaDoc = {
    document: {
      id: "0:0",
      name: "Typography Showcase",
      type: "DOCUMENT",
      children: [
        {
          id: "1:1",
          name: "Text Artboard",
          type: "FRAME",
          absoluteBoundingBox: { x: 0, y: 0, width: 800, height: 600 },
          layoutMode: "VERTICAL",
          itemSpacing: 16,
          paddingTop: 24,
          paddingLeft: 24,
          children: [
            {
              id: "1:2",
              name: "Hero Display Heading",
              type: "TEXT",
              characters: "Autonomous Design Engineering",
              fills: [{ type: "SOLID", color: { r: 0.95, g: 0.97, b: 1.0 } }],
              style: {
                fontFamily: "Outfit",
                fontSize: 40,
                fontWeight: 800,
                letterSpacing: -1,
                lineHeightPx: 48,
                textAlignHorizontal: "LEFT",
              },
            },
            {
              id: "1:3",
              name: "Body Paragraph Text",
              type: "TEXT",
              characters: "Synthesizing production React 19 from design specifications.",
              fills: [{ type: "SOLID", color: { r: 0.6, g: 0.65, b: 0.75 } }],
              style: {
                fontFamily: "Inter",
                fontSize: 16,
                fontWeight: 400,
                lineHeightPx: 24,
                textAlignHorizontal: "LEFT",
              },
            },
          ],
        },
      ],
    },
  };

  // 3. Figma Document with Nested Component Instances
  const componentInstanceFigmaDoc = {
    document: {
      id: "0:0",
      name: "Components Document",
      type: "DOCUMENT",
      children: [
        {
          id: "2:1",
          name: "Main App Bar",
          type: "COMPONENT",
          layoutMode: "HORIZONTAL",
          itemSpacing: 24,
          primaryAxisAlignItems: "SPACE_BETWEEN",
          counterAxisAlignItems: "CENTER",
          children: [
            {
              id: "2:2",
              name: "Brand Logo Container",
              type: "FRAME",
              children: [
                {
                  id: "2:3",
                  name: "Logo Text",
                  type: "TEXT",
                  characters: "AIUI Platform",
                  style: { fontSize: 20, fontWeight: 700 },
                },
              ],
            },
            {
              id: "2:4",
              name: "Navigation Menu Instance",
              type: "INSTANCE",
              layoutMode: "HORIZONTAL",
              itemSpacing: 16,
              children: [
                {
                  id: "2:5",
                  name: "Primary CTA Button Instance",
                  type: "INSTANCE",
                  cornerRadius: 6,
                  fills: [{ type: "SOLID", color: { r: 0.2, g: 0.6, b: 1.0 } }],
                  children: [
                    {
                      id: "2:6",
                      name: "Button Text",
                      type: "TEXT",
                      characters: "Deploy Now",
                      style: { fontSize: 14, fontWeight: 600 },
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

  // 4. Figma Document with Vectors, Shapes, and Icons
  const vectorShapesFigmaDoc = {
    document: {
      id: "0:0",
      name: "Vector & Shape Icons",
      type: "DOCUMENT",
      children: [
        {
          id: "3:1",
          name: "Icons Showcase Frame",
          type: "FRAME",
          absoluteBoundingBox: { x: 0, y: 0, width: 400, height: 400 },
          layoutMode: "HORIZONTAL",
          itemSpacing: 16,
          children: [
            {
              id: "3:2",
              name: "Checkmark Icon Vector",
              type: "VECTOR",
              absoluteBoundingBox: { x: 10, y: 10, width: 24, height: 24 },
              fills: [{ type: "SOLID", color: { r: 0.1, g: 0.8, b: 0.4 } }],
            },
            {
              id: "3:3",
              name: "Status Indicator Dot",
              type: "ELLIPSE",
              absoluteBoundingBox: { x: 40, y: 10, width: 12, height: 12 },
              fills: [{ type: "SOLID", color: { r: 0.2, g: 0.5, b: 0.9 } }],
            },
            {
              id: "3:4",
              name: "Rating Star Shape",
              type: "STAR",
              absoluteBoundingBox: { x: 60, y: 10, width: 20, height: 20 },
              fills: [{ type: "SOLID", color: { r: 1.0, g: 0.8, b: 0.0 } }],
            },
            {
              id: "3:5",
              name: "Boolean Mask Compound",
              type: "BOOLEAN_OPERATION",
              absoluteBoundingBox: { x: 90, y: 10, width: 32, height: 32 },
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

  it("should parse and preserve rich text nodes with font styling, weights, line heights, and colors", async () => {
    const irDoc = await adapter.parse({
      type: "figma",
      data: richTextFigmaDoc,
    });

    const nodesList = Object.values(irDoc.nodes);
    const heading = nodesList.find((n) => n.name === "Hero Display Heading");
    expect(heading).toBeDefined();
    expect(heading?.type).toBe("heading");
    expect(heading?.styles.fontFamily).toBe("Outfit");
    expect(heading?.styles.fontSize).toBe("40px");
    expect(heading?.styles.fontWeight).toBe(800);
    expect(heading?.styles.color).toBe("#F2F7FF");
    expect(heading?.content?.text).toBe("Autonomous Design Engineering");

    const body = nodesList.find((n) => n.name === "Body Paragraph Text");
    expect(body).toBeDefined();
    expect(body?.type).toBe("text");
    expect(body?.styles.fontFamily).toBe("Inter");
    expect(body?.styles.fontSize).toBe("16px");
    expect(body?.styles.color).toBe("#99A6BF");
  });

  it("should parse nested Figma COMPONENT and INSTANCE hierarchies", async () => {
    const irDoc = await adapter.parse({
      type: "figma",
      data: componentInstanceFigmaDoc,
    });

    const rootNode = irDoc.nodes[irDoc.rootNodeId];
    expect(rootNode).toBeDefined();
    expect(rootNode.type).toBe("navbar");
    expect(rootNode.layout.justifyContent).toBe("space-between");

    const btnInstance = Object.values(irDoc.nodes).find((n) => n.name.includes("Primary CTA Button Instance"));
    expect(btnInstance).toBeDefined();
    expect(btnInstance?.type).toBe("button");
    expect(btnInstance?.styles.backgroundColor).toBe("#3399FF");
  });

  it("should translate VECTOR, ELLIPSE, STAR, and BOOLEAN_OPERATION nodes into icon archetypes", async () => {
    const irDoc = await adapter.parse({
      type: "figma",
      data: vectorShapesFigmaDoc,
    });

    const nodesList = Object.values(irDoc.nodes);
    const vectorNode = nodesList.find((n) => n.name.includes("Checkmark Icon Vector"));
    expect(vectorNode).toBeDefined();
    expect(vectorNode?.type).toBe("icon");
    expect(vectorNode?.styles.color).toBe("#1ACC66");

    const ellipseNode = nodesList.find((n) => n.name.includes("Status Indicator Dot"));
    expect(ellipseNode).toBeDefined();
    expect(ellipseNode?.type).toBe("icon");

    const starNode = nodesList.find((n) => n.name.includes("Rating Star Shape"));
    expect(starNode).toBeDefined();
    expect(starNode?.type).toBe("icon");
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
