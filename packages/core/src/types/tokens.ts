import { z } from "zod";

export const ColorTokensSchema = z.object({
  primary: z.string().default("#3B82F6"),
  primaryHover: z.string().default("#2563EB"),
  primaryActive: z.string().default("#1D4ED8"),
  primaryForeground: z.string().default("#FFFFFF"),
  secondary: z.string().default("#64748B"),
  secondaryForeground: z.string().default("#FFFFFF"),
  background: z.string().default("#0F172A"),
  surface: z.string().default("#1E293B"),
  surfaceCard: z.string().default("#1E293B"),
  surfaceElevated: z.string().default("#334155"),
  text: z.string().default("#F8FAFC"),
  textMuted: z.string().default("#94A3B8"),
  textSubtle: z.string().default("#64748B"),
  textInverse: z.string().default("#0F172A"),
  border: z.string().default("#334155"),
  borderLight: z.string().default("#475569"),
  borderFocus: z.string().default("#3B82F6"),
  accent: z.string().default("#8B5CF6"),
  success: z.string().default("#10B981"),
  warning: z.string().default("#F59E0B"),
  error: z.string().default("#EF4444"),
  info: z.string().default("#06B6D4"),
  gradients: z.record(z.string()).default({}),
});

export type ColorTokens = z.infer<typeof ColorTokensSchema>;

export const TypographyTokensSchema = z.object({
  fontFamilies: z.object({
    sans: z.string().default("Inter, system-ui, sans-serif"),
    serif: z.string().default("Georgia, serif"),
    mono: z.string().default("Fira Code, monospace"),
    display: z.string().default("Inter, system-ui, sans-serif"),
  }),
  fontSizes: z.object({
    xs: z.string().default("12px"),
    sm: z.string().default("14px"),
    base: z.string().default("16px"),
    md: z.string().default("18px"),
    lg: z.string().default("20px"),
    xl: z.string().default("24px"),
    "2xl": z.string().default("30px"),
    "3xl": z.string().default("36px"),
    "4xl": z.string().default("48px"),
  }),
  fontWeights: z.object({
    normal: z.number().default(400),
    medium: z.number().default(500),
    semibold: z.number().default(600),
    bold: z.number().default(700),
  }),
  lineHeights: z.object({
    tight: z.number().default(1.25),
    normal: z.number().default(1.5),
    relaxed: z.number().default(1.75),
  }),
  letterSpacings: z.object({
    tight: z.string().default("-0.025em"),
    normal: z.string().default("0em"),
    wide: z.string().default("0.025em"),
  }),
});

export type TypographyTokens = z.infer<typeof TypographyTokensSchema>;

export const SpacingTokensSchema = z.object({
  scale: z.record(z.string()).default({
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
  }),
});

export type SpacingTokens = z.infer<typeof SpacingTokensSchema>;

export const RadiusTokensSchema = z.object({
  none: z.string().default("0px"),
  sm: z.string().default("4px"),
  md: z.string().default("8px"),
  lg: z.string().default("12px"),
  xl: z.string().default("16px"),
  full: z.string().default("9999px"),
});

export type RadiusTokens = z.infer<typeof RadiusTokensSchema>;

export const ShadowTokensSchema = z.object({
  none: z.string().default("none"),
  sm: z.string().default("0 1px 2px 0 rgba(0, 0, 0, 0.05)"),
  md: z.string().default("0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"),
  lg: z.string().default("0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"),
  xl: z.string().default("0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"),
  inner: z.string().default("inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)"),
});

export type ShadowTokens = z.infer<typeof ShadowTokensSchema>;

export const DesignTokensSchema = z.object({
  colors: ColorTokensSchema,
  typography: TypographyTokensSchema,
  spacing: SpacingTokensSchema,
  radius: RadiusTokensSchema,
  shadows: ShadowTokensSchema,
});

export type DesignTokens = z.infer<typeof DesignTokensSchema>;
