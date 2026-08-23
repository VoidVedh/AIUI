# UI Intermediate Representation (UI IR) Specification

The UI Intermediate Representation (UI IR) is the central framework-agnostic boundary of AIUI. It isolates visual perception from code generation.

---

## 1. Design Principles

1. **Framework Agnostic**: The IR represents layout, semantic hierarchy, styling, typography, colors, and constraints without depending on React, Flutter, or HTML specifics.
2. **Deterministic Geometry & Flow**: Nodes capture both spatial positioning (`position`, `dimensions`) and flow layout models (`flex`, `grid`, `absolute`).
3. **Explicit Confidence**: Every node and style attribute carries a confidence score ($0.0 \dots 1.0$), ensuring ambiguous visual details are flagged rather than hallucinated.
4. **Token Linked**: Styles reference design tokens where applicable, promoting consistency over arbitrary values.

---

## 2. JSON Schema & Node Definitions

A `UIIRDocument` consists of:

```typescript
export interface UIIRDocument {
  version: "1.0.0";
  id: string;
  name: string;
  viewport: {
    width: number;
    height: number;
    devicePixelRatio?: number;
  };
  rootNodeId: string;
  nodes: Record<string, UINode>;
  metadata: {
    sourceType: "screenshot" | "figma" | "synthetic";
    confidence: number;
    extractedAt: string;
    targetFrameworks: ("react" | "vanillajs" | "flutter")[];
  };
}
```

### Node Types

| Type | Semantic Category | Common HTML/Widget Equivalent |
|---|---|---|
| `page` | Root document canvas | `<html><body>` / `Scaffold` |
| `section` | Major semantic section | `<section>` / `Container` |
| `navbar` | Navigation bar | `<nav>` / `AppBar` |
| `sidebar` | Lateral navigation | `<aside>` / `Drawer` |
| `hero` | Prominent header banner | Hero `<section>` / `Stack` |
| `card` | Elevated content container | `<article>` / `Card` |
| `container` | Generic layout wrapper | `<div>` / `Container` |
| `grid` | Grid layout | CSS Grid / `GridView` |
| `flex` | Flexbox layout | CSS Flex / `Row` or `Column` |
| `button` | Actionable button | `<button>` / `ElevatedButton` |
| `heading` | Hierarchy heading (`h1`-`h6`) | `<h1>`-`<h6>` / `Text(style: headline)` |
| `text` | Body paragraph or label | `<p>`, `<span>` / `Text` |
| `input` | Form input field | `<input>` / `TextField` |
| `image` | Static image / illustration | `<img>` / `Image.network` |
| `icon` | Graphical icon | SVG / `Icon` / Lucide icon |
| `badge` | Status chip / badge | `<span>` / `Chip` |
| `avatar` | User profile avatar | `<img>` / `CircleAvatar` |
| `list` | Ordered / unordered list | `<ul>` / `ListView` |
| `modal` | Overlay dialog | `<dialog>` / `AlertDialog` |

---

## 3. Node Attributes & Schema

Each `UINode` has the following properties:

```typescript
export interface UINode {
  id: string;
  type: UINodeType;
  name?: string;
  parentId: string | null;
  childIds: string[];
  
  // Spatial Geometry
  position: {
    x: number;
    y: number;
    relativeTo?: "parent" | "viewport" | "flow";
  };
  dimensions: {
    width: number | "auto" | "100%" | string;
    height: number | "auto" | "100%" | string;
    minWidth?: number | string;
    maxWidth?: number | string;
    minHeight?: number | string;
    maxHeight?: number | string;
    aspectRatio?: number;
  };

  // Layout Engine
  layout: {
    display: "flex" | "grid" | "block" | "inline-block" | "absolute";
    flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
    justifyContent?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around" | "space-evenly";
    alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
    gap?: number | string;
    flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
    gridTemplateColumns?: string;
    gridTemplateRows?: string;
    alignSelf?: "auto" | "flex-start" | "center" | "flex-end" | "stretch";
  };

  // Styling & Tokens
  styles: UIStyles;

  // Content
  content?: {
    text?: string;
    iconName?: string;
    src?: string;
    alt?: string;
    placeholder?: string;
    inputType?: "text" | "email" | "password" | "number" | "search";
  };

  // Accessibility & Semantics
  semanticRole?: string;
  ariaLabel?: string;

  // Quality & Diagnostics
  confidence: number; // 0.0 to 1.0
  relationships?: {
    alignsWith?: string[];
    adjacentTo?: string[];
  };
}

export interface UIStyles {
  // Colors & Backgrounds
  backgroundColor?: string;
  backgroundGradient?: string;
  opacity?: number;

  // Typography
  color?: string;
  fontFamily?: string;
  fontSize?: number | string;
  fontWeight?: number | string;
  lineHeight?: number | string;
  letterSpacing?: number | string;
  textAlign?: "left" | "center" | "right" | "justify";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";

  // Spacing
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  // Borders & Corners
  border?: {
    width: number;
    style: "solid" | "dashed" | "dotted" | "none";
    color: string;
  };
  borderRadius?: {
    topLeft: number;
    topRight: number;
    bottomRight: number;
    bottomLeft: number;
  };

  // Elevation & Shadows
  boxShadow?: string;
  backdropFilter?: string;
  
  // Custom token references
  tokenRefs?: Record<string, string>;
}
```
