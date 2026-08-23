import { UIIRDocument } from "../types/ir.js";
import {
  DesignTokens,
  DesignTokensSchema,
  ColorTokens,
  TypographyTokens,
  SpacingTokens,
  RadiusTokens,
  ShadowTokens,
} from "../types/tokens.js";

export class DesignTokenEngine {
  /**
   * Extracts a complete DesignTokens structure from a UIIRDocument.
   */
  public static extractTokens(ir: UIIRDocument): DesignTokens {
    const rawColors = new Set<string>();
    const rawFontFamilies = new Set<string>();
    const rawFontSizes = new Set<string | number>();
    const rawFontWeights = new Set<string | number>();
    const rawSpacings = new Set<number>();
    const rawRadii = new Set<number>();
    const rawShadows = new Set<string>();
    const rawGradients = new Map<string, string>();

    // Traverse all nodes
    for (const node of Object.values(ir.nodes)) {
      const styles = node.styles;
      if (!styles) continue;

      if (styles.backgroundColor && styles.backgroundColor !== "transparent") {
        rawColors.add(styles.backgroundColor);
      }
      if (styles.color && styles.color !== "transparent") {
        rawColors.add(styles.color);
      }
      if (styles.border?.color && styles.border.color !== "transparent") {
        rawColors.add(styles.border.color);
      }
      if (styles.backgroundGradient) {
        rawGradients.set(`gradient-${rawGradients.size + 1}`, styles.backgroundGradient);
      }
      if (styles.fontFamily) {
        rawFontFamilies.add(styles.fontFamily);
      }
      if (styles.fontSize) {
        rawFontSizes.add(styles.fontSize);
      }
      if (styles.fontWeight) {
        rawFontWeights.add(styles.fontWeight);
      }
      if (styles.boxShadow && styles.boxShadow !== "none") {
        rawShadows.add(styles.boxShadow);
      }

      if (styles.padding) {
        if (styles.padding.top) rawSpacings.add(styles.padding.top);
        if (styles.padding.right) rawSpacings.add(styles.padding.right);
        if (styles.padding.bottom) rawSpacings.add(styles.padding.bottom);
        if (styles.padding.left) rawSpacings.add(styles.padding.left);
      }
      if (styles.margin) {
        if (styles.margin.top) rawSpacings.add(styles.margin.top);
        if (styles.margin.right) rawSpacings.add(styles.margin.right);
        if (styles.margin.bottom) rawSpacings.add(styles.margin.bottom);
        if (styles.margin.left) rawSpacings.add(styles.margin.left);
      }

      if (styles.borderRadius) {
        if (styles.borderRadius.topLeft) rawRadii.add(styles.borderRadius.topLeft);
        if (styles.borderRadius.topRight) rawRadii.add(styles.borderRadius.topRight);
        if (styles.borderRadius.bottomRight) rawRadii.add(styles.borderRadius.bottomRight);
        if (styles.borderRadius.bottomLeft) rawRadii.add(styles.borderRadius.bottomLeft);
      }
    }

    // Root page background & text extraction
    const rootNode = ir.nodes[ir.rootNodeId];
    const rootBg = rootNode?.styles?.backgroundColor || "#0F172A";
    const rootText = rootNode?.styles?.color || "#F8FAFC";

    // Build Semantic Colors
    const colors: ColorTokens = {
      primary: this.inferPrimaryColor(rawColors, rootBg) || "#3B82F6",
      primaryHover: "#2563EB",
      primaryActive: "#1D4ED8",
      primaryForeground: "#FFFFFF",
      secondary: "#64748B",
      secondaryForeground: "#FFFFFF",
      background: rootBg,
      surface: this.inferSurfaceColor(rawColors, rootBg) || "#1E293B",
      surfaceCard: this.inferSurfaceCardColor(rawColors, rootBg) || "#1E293B",
      surfaceElevated: "#334155",
      text: rootText,
      textMuted: this.inferTextMutedColor(rawColors, rootText) || "#94A3B8",
      textSubtle: "#64748B",
      textInverse: rootBg,
      border: this.inferBorderColor(rawColors, rootBg) || "#334155",
      borderLight: "#475569",
      borderFocus: "#3B82F6",
      accent: this.inferAccentColor(rawColors, rootBg) || "#8B5CF6",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#06B6D4",
      gradients: Object.fromEntries(rawGradients),
    };

    // Build Typography Tokens
    const primaryFont = Array.from(rawFontFamilies)[0] || "Inter, system-ui, sans-serif";
    const typography: TypographyTokens = {
      fontFamilies: {
        sans: primaryFont,
        serif: "Georgia, serif",
        mono: "Fira Code, monospace",
        display: primaryFont,
      },
      fontSizes: {
        xs: "12px",
        sm: "14px",
        base: "16px",
        md: "18px",
        lg: "20px",
        xl: "24px",
        "2xl": "30px",
        "3xl": "36px",
        "4xl": "48px",
      },
      fontWeights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
      lineHeights: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
      },
      letterSpacings: {
        tight: "-0.025em",
        normal: "0em",
        wide: "0.025em",
      },
    };

    // Spacing
    const spacing: SpacingTokens = {
      scale: {
        "0": "0px",
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
        "16": "64px",
        "20": "80px",
        "24": "96px",
      },
    };

    // Radius
    const maxRadius = Math.max(0, ...Array.from(rawRadii));
    const radius: RadiusTokens = {
      none: "0px",
      sm: "4px",
      md: maxRadius >= 8 ? `${maxRadius}px` : "8px",
      lg: "12px",
      xl: "16px",
      full: "9999px",
    };

    // Shadows
    const shadowList = Array.from(rawShadows);
    const shadows: ShadowTokens = {
      none: "none",
      sm: shadowList[0] || "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      md: shadowList[1] || "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    };

    return DesignTokensSchema.parse({
      colors,
      typography,
      spacing,
      radius,
      shadows,
    });
  }

  /**
   * Generates CSS Custom Properties `:root { ... }` from DesignTokens.
   */
  public static toCssVariables(tokens: DesignTokens): string {
    const lines: string[] = [":root {"];

    // Colors
    for (const [key, value] of Object.entries(tokens.colors)) {
      if (key === "gradients") {
        for (const [gradKey, gradVal] of Object.entries(value as Record<string, string>)) {
          lines.push(`  --${gradKey}: ${gradVal};`);
        }
      } else {
        const kebab = key.replace(/([A-Z])/g, "-$1").toLowerCase();
        lines.push(`  --color-${kebab}: ${value};`);
      }
    }

    // Typography
    lines.push(`  --font-sans: ${tokens.typography.fontFamilies.sans};`);
    lines.push(`  --font-serif: ${tokens.typography.fontFamilies.serif};`);
    lines.push(`  --font-mono: ${tokens.typography.fontFamilies.mono};`);
    lines.push(`  --font-display: ${tokens.typography.fontFamilies.display};`);

    for (const [key, val] of Object.entries(tokens.typography.fontSizes)) {
      lines.push(`  --text-${key}: ${val};`);
    }

    // Spacing
    for (const [key, val] of Object.entries(tokens.spacing.scale)) {
      lines.push(`  --space-${key}: ${val};`);
    }

    // Radius
    for (const [key, val] of Object.entries(tokens.radius)) {
      lines.push(`  --radius-${key}: ${val};`);
    }

    // Shadows
    for (const [key, val] of Object.entries(tokens.shadows)) {
      lines.push(`  --shadow-${key}: ${val};`);
    }

    lines.push("}");
    return lines.join("\n");
  }

  private static inferPrimaryColor(colors: Set<string>, bg: string): string | null {
    const list = Array.from(colors);
    // Find a vibrant chromatic non-background color (e.g. blue, purple, emerald, orange)
    for (const c of list) {
      if (c.toLowerCase() !== bg.toLowerCase() && !this.isNeutral(c)) {
        return c;
      }
    }
    return list[0] || "#3B82F6";
  }

  private static inferSurfaceColor(colors: Set<string>, bg: string): string | null {
    for (const c of Array.from(colors)) {
      if (c.toLowerCase() !== bg.toLowerCase() && this.isNeutral(c)) {
        return c;
      }
    }
    return "#1E293B";
  }

  private static inferSurfaceCardColor(colors: Set<string>, bg: string): string | null {
    const surface = this.inferSurfaceColor(colors, bg);
    return surface || "#1E293B";
  }

  private static inferTextMutedColor(colors: Set<string>, rootText: string): string | null {
    for (const c of Array.from(colors)) {
      if (c.toLowerCase() !== rootText.toLowerCase() && (c.includes("88") || c.includes("94") || c.includes("a3") || c.includes("slate") || c.includes("gray"))) {
        return c;
      }
    }
    return "#94A3B8";
  }

  private static inferBorderColor(colors: Set<string>, bg: string): string | null {
    for (const c of Array.from(colors)) {
      if (c.toLowerCase() !== bg.toLowerCase() && (c.includes("33") || c.includes("47") || c.includes("2e") || c.includes("border"))) {
        return c;
      }
    }
    return "#334155";
  }

  private static inferAccentColor(colors: Set<string>, bg: string): string | null {
    const primary = this.inferPrimaryColor(colors, bg);
    for (const c of Array.from(colors)) {
      if (c !== primary && c !== bg && !this.isNeutral(c)) {
        return c;
      }
    }
    return "#8B5CF6";
  }

  private static isNeutral(hex: string): boolean {
    const clean = hex.replace("#", "");
    if (clean.length === 6) {
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      // Slate/dark greys like #1E293B, #0F172A, #334155 have maxDiff < 45
      return maxDiff < 45;
    }
    return false;
  }
}
