import { z } from "zod";

export const UINodeTypeSchema = z.enum([
  "page",
  "section",
  "container",
  "navbar",
  "sidebar",
  "header",
  "footer",
  "hero",
  "card",
  "grid",
  "flex",
  "button",
  "heading",
  "text",
  "input",
  "image",
  "icon",
  "badge",
  "avatar",
  "list",
  "modal",
  "form",
  "stat",
  "divider"
]);

export type UINodeType = z.infer<typeof UINodeTypeSchema>;

export const PositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  relativeTo: z.enum(["parent", "viewport", "flow"]).default("flow"),
});

export type Position = z.infer<typeof PositionSchema>;

export const DimensionsSchema = z.object({
  width: z.union([z.number(), z.string()]).default("auto"),
  height: z.union([z.number(), z.string()]).default("auto"),
  minWidth: z.union([z.number(), z.string()]).optional(),
  maxWidth: z.union([z.number(), z.string()]).optional(),
  minHeight: z.union([z.number(), z.string()]).optional(),
  maxHeight: z.union([z.number(), z.string()]).optional(),
  aspectRatio: z.number().optional(),
});

export type Dimensions = z.infer<typeof DimensionsSchema>;

export const LayoutSchema = z.object({
  display: z.enum(["flex", "grid", "block", "inline-block", "absolute"]).default("flex"),
  flexDirection: z.enum(["row", "column", "row-reverse", "column-reverse"]).default("column"),
  justifyContent: z.enum([
    "flex-start",
    "center",
    "flex-end",
    "space-between",
    "space-around",
    "space-evenly"
  ]).default("flex-start"),
  alignItems: z.enum(["flex-start", "center", "flex-end", "stretch", "baseline"]).default("stretch"),
  gap: z.union([z.number(), z.string()]).default(0),
  flexWrap: z.enum(["nowrap", "wrap", "wrap-reverse"]).default("nowrap"),
  gridTemplateColumns: z.string().optional(),
  gridTemplateRows: z.string().optional(),
  alignSelf: z.enum(["auto", "flex-start", "center", "flex-end", "stretch"]).optional(),
});

export type Layout = z.infer<typeof LayoutSchema>;

export const SpacingSchema = z.object({
  top: z.number().default(0),
  right: z.number().default(0),
  bottom: z.number().default(0),
  left: z.number().default(0),
});

export type Spacing = z.infer<typeof SpacingSchema>;

export const BorderSchema = z.object({
  width: z.number().default(0),
  style: z.enum(["solid", "dashed", "dotted", "none"]).default("none"),
  color: z.string().default("transparent"),
});

export type Border = z.infer<typeof BorderSchema>;

export const BorderRadiusSchema = z.object({
  topLeft: z.number().default(0),
  topRight: z.number().default(0),
  bottomRight: z.number().default(0),
  bottomLeft: z.number().default(0),
});

export type BorderRadius = z.infer<typeof BorderRadiusSchema>;

export const UIStylesSchema = z.object({
  backgroundColor: z.string().optional(),
  backgroundGradient: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
  color: z.string().optional(),
  fontFamily: z.string().optional(),
  fontSize: z.union([z.number(), z.string()]).optional(),
  fontWeight: z.union([z.number(), z.string()]).optional(),
  lineHeight: z.union([z.number(), z.string()]).optional(),
  letterSpacing: z.union([z.number(), z.string()]).optional(),
  textAlign: z.enum(["left", "center", "right", "justify"]).optional(),
  textTransform: z.enum(["none", "uppercase", "lowercase", "capitalize"]).optional(),
  padding: SpacingSchema.optional(),
  margin: SpacingSchema.optional(),
  border: BorderSchema.optional(),
  borderRadius: BorderRadiusSchema.optional(),
  boxShadow: z.string().optional(),
  backdropFilter: z.string().optional(),
  tokenRefs: z.record(z.string()).optional(),
});

export type UIStyles = z.infer<typeof UIStylesSchema>;

export const NodeContentSchema = z.object({
  text: z.string().optional(),
  iconName: z.string().optional(),
  src: z.string().optional(),
  alt: z.string().optional(),
  placeholder: z.string().optional(),
  inputType: z.enum(["text", "email", "password", "number", "search", "textarea"]).optional(),
  badgeVariant: z.string().optional(),
});

export type NodeContent = z.infer<typeof NodeContentSchema>;

export const UINodeSchema = z.object({
  id: z.string(),
  type: UINodeTypeSchema,
  name: z.string().optional(),
  parentId: z.string().nullable(),
  childIds: z.array(z.string()).default([]),
  position: PositionSchema.default({ x: 0, y: 0, relativeTo: "flow" }),
  dimensions: DimensionsSchema.default({ width: "auto", height: "auto" }),
  layout: LayoutSchema.default({ display: "flex", flexDirection: "column" }),
  styles: UIStylesSchema.default({}),
  content: NodeContentSchema.optional(),
  semanticRole: z.string().optional(),
  ariaLabel: z.string().optional(),
  confidence: z.number().min(0).max(1).default(1.0),
  relationships: z.object({
    alignsWith: z.array(z.string()).optional(),
    adjacentTo: z.array(z.string()).optional(),
  }).optional(),
});

export type UINode = z.infer<typeof UINodeSchema>;

export const UIIRDocumentSchema = z.object({
  version: z.literal("1.0.0").default("1.0.0"),
  id: z.string(),
  name: z.string(),
  viewport: z.object({
    width: z.number(),
    height: z.number(),
    devicePixelRatio: z.number().default(1),
  }),
  rootNodeId: z.string(),
  nodes: z.record(UINodeSchema),
  metadata: z.object({
    sourceType: z.enum(["screenshot", "figma", "synthetic"]),
    confidence: z.number().min(0).max(1).default(1.0),
    extractedAt: z.string(),
    targetFrameworks: z.array(z.enum(["react", "vanillajs", "flutter"])).default(["react"]),
  }),
});

export type UIIRDocument = z.infer<typeof UIIRDocumentSchema>;
