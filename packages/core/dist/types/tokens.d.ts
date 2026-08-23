import { z } from "zod";
export declare const ColorTokensSchema: z.ZodObject<{
    primary: z.ZodDefault<z.ZodString>;
    primaryHover: z.ZodDefault<z.ZodString>;
    primaryActive: z.ZodDefault<z.ZodString>;
    primaryForeground: z.ZodDefault<z.ZodString>;
    secondary: z.ZodDefault<z.ZodString>;
    secondaryForeground: z.ZodDefault<z.ZodString>;
    background: z.ZodDefault<z.ZodString>;
    surface: z.ZodDefault<z.ZodString>;
    surfaceCard: z.ZodDefault<z.ZodString>;
    surfaceElevated: z.ZodDefault<z.ZodString>;
    text: z.ZodDefault<z.ZodString>;
    textMuted: z.ZodDefault<z.ZodString>;
    textSubtle: z.ZodDefault<z.ZodString>;
    textInverse: z.ZodDefault<z.ZodString>;
    border: z.ZodDefault<z.ZodString>;
    borderLight: z.ZodDefault<z.ZodString>;
    borderFocus: z.ZodDefault<z.ZodString>;
    accent: z.ZodDefault<z.ZodString>;
    success: z.ZodDefault<z.ZodString>;
    warning: z.ZodDefault<z.ZodString>;
    error: z.ZodDefault<z.ZodString>;
    info: z.ZodDefault<z.ZodString>;
    gradients: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    text: string;
    border: string;
    primary: string;
    primaryHover: string;
    primaryActive: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    background: string;
    surface: string;
    surfaceCard: string;
    surfaceElevated: string;
    textMuted: string;
    textSubtle: string;
    textInverse: string;
    borderLight: string;
    borderFocus: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    gradients: Record<string, string>;
}, {
    text?: string | undefined;
    border?: string | undefined;
    primary?: string | undefined;
    primaryHover?: string | undefined;
    primaryActive?: string | undefined;
    primaryForeground?: string | undefined;
    secondary?: string | undefined;
    secondaryForeground?: string | undefined;
    background?: string | undefined;
    surface?: string | undefined;
    surfaceCard?: string | undefined;
    surfaceElevated?: string | undefined;
    textMuted?: string | undefined;
    textSubtle?: string | undefined;
    textInverse?: string | undefined;
    borderLight?: string | undefined;
    borderFocus?: string | undefined;
    accent?: string | undefined;
    success?: string | undefined;
    warning?: string | undefined;
    error?: string | undefined;
    info?: string | undefined;
    gradients?: Record<string, string> | undefined;
}>;
export type ColorTokens = z.infer<typeof ColorTokensSchema>;
export declare const TypographyTokensSchema: z.ZodObject<{
    fontFamilies: z.ZodObject<{
        sans: z.ZodDefault<z.ZodString>;
        serif: z.ZodDefault<z.ZodString>;
        mono: z.ZodDefault<z.ZodString>;
        display: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        display: string;
        sans: string;
        serif: string;
        mono: string;
    }, {
        display?: string | undefined;
        sans?: string | undefined;
        serif?: string | undefined;
        mono?: string | undefined;
    }>;
    fontSizes: z.ZodObject<{
        xs: z.ZodDefault<z.ZodString>;
        sm: z.ZodDefault<z.ZodString>;
        base: z.ZodDefault<z.ZodString>;
        md: z.ZodDefault<z.ZodString>;
        lg: z.ZodDefault<z.ZodString>;
        xl: z.ZodDefault<z.ZodString>;
        "2xl": z.ZodDefault<z.ZodString>;
        "3xl": z.ZodDefault<z.ZodString>;
        "4xl": z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        xs: string;
        sm: string;
        base: string;
        md: string;
        lg: string;
        xl: string;
        "2xl": string;
        "3xl": string;
        "4xl": string;
    }, {
        xs?: string | undefined;
        sm?: string | undefined;
        base?: string | undefined;
        md?: string | undefined;
        lg?: string | undefined;
        xl?: string | undefined;
        "2xl"?: string | undefined;
        "3xl"?: string | undefined;
        "4xl"?: string | undefined;
    }>;
    fontWeights: z.ZodObject<{
        normal: z.ZodDefault<z.ZodNumber>;
        medium: z.ZodDefault<z.ZodNumber>;
        semibold: z.ZodDefault<z.ZodNumber>;
        bold: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        normal: number;
        medium: number;
        semibold: number;
        bold: number;
    }, {
        normal?: number | undefined;
        medium?: number | undefined;
        semibold?: number | undefined;
        bold?: number | undefined;
    }>;
    lineHeights: z.ZodObject<{
        tight: z.ZodDefault<z.ZodNumber>;
        normal: z.ZodDefault<z.ZodNumber>;
        relaxed: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        normal: number;
        tight: number;
        relaxed: number;
    }, {
        normal?: number | undefined;
        tight?: number | undefined;
        relaxed?: number | undefined;
    }>;
    letterSpacings: z.ZodObject<{
        tight: z.ZodDefault<z.ZodString>;
        normal: z.ZodDefault<z.ZodString>;
        wide: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        normal: string;
        tight: string;
        wide: string;
    }, {
        normal?: string | undefined;
        tight?: string | undefined;
        wide?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    fontFamilies: {
        display: string;
        sans: string;
        serif: string;
        mono: string;
    };
    fontSizes: {
        xs: string;
        sm: string;
        base: string;
        md: string;
        lg: string;
        xl: string;
        "2xl": string;
        "3xl": string;
        "4xl": string;
    };
    fontWeights: {
        normal: number;
        medium: number;
        semibold: number;
        bold: number;
    };
    lineHeights: {
        normal: number;
        tight: number;
        relaxed: number;
    };
    letterSpacings: {
        normal: string;
        tight: string;
        wide: string;
    };
}, {
    fontFamilies: {
        display?: string | undefined;
        sans?: string | undefined;
        serif?: string | undefined;
        mono?: string | undefined;
    };
    fontSizes: {
        xs?: string | undefined;
        sm?: string | undefined;
        base?: string | undefined;
        md?: string | undefined;
        lg?: string | undefined;
        xl?: string | undefined;
        "2xl"?: string | undefined;
        "3xl"?: string | undefined;
        "4xl"?: string | undefined;
    };
    fontWeights: {
        normal?: number | undefined;
        medium?: number | undefined;
        semibold?: number | undefined;
        bold?: number | undefined;
    };
    lineHeights: {
        normal?: number | undefined;
        tight?: number | undefined;
        relaxed?: number | undefined;
    };
    letterSpacings: {
        normal?: string | undefined;
        tight?: string | undefined;
        wide?: string | undefined;
    };
}>;
export type TypographyTokens = z.infer<typeof TypographyTokensSchema>;
export declare const SpacingTokensSchema: z.ZodObject<{
    scale: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    scale: Record<string, string>;
}, {
    scale?: Record<string, string> | undefined;
}>;
export type SpacingTokens = z.infer<typeof SpacingTokensSchema>;
export declare const RadiusTokensSchema: z.ZodObject<{
    none: z.ZodDefault<z.ZodString>;
    sm: z.ZodDefault<z.ZodString>;
    md: z.ZodDefault<z.ZodString>;
    lg: z.ZodDefault<z.ZodString>;
    xl: z.ZodDefault<z.ZodString>;
    full: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
}, {
    none?: string | undefined;
    sm?: string | undefined;
    md?: string | undefined;
    lg?: string | undefined;
    xl?: string | undefined;
    full?: string | undefined;
}>;
export type RadiusTokens = z.infer<typeof RadiusTokensSchema>;
export declare const ShadowTokensSchema: z.ZodObject<{
    none: z.ZodDefault<z.ZodString>;
    sm: z.ZodDefault<z.ZodString>;
    md: z.ZodDefault<z.ZodString>;
    lg: z.ZodDefault<z.ZodString>;
    xl: z.ZodDefault<z.ZodString>;
    inner: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    inner: string;
}, {
    none?: string | undefined;
    sm?: string | undefined;
    md?: string | undefined;
    lg?: string | undefined;
    xl?: string | undefined;
    inner?: string | undefined;
}>;
export type ShadowTokens = z.infer<typeof ShadowTokensSchema>;
export declare const DesignTokensSchema: z.ZodObject<{
    colors: z.ZodObject<{
        primary: z.ZodDefault<z.ZodString>;
        primaryHover: z.ZodDefault<z.ZodString>;
        primaryActive: z.ZodDefault<z.ZodString>;
        primaryForeground: z.ZodDefault<z.ZodString>;
        secondary: z.ZodDefault<z.ZodString>;
        secondaryForeground: z.ZodDefault<z.ZodString>;
        background: z.ZodDefault<z.ZodString>;
        surface: z.ZodDefault<z.ZodString>;
        surfaceCard: z.ZodDefault<z.ZodString>;
        surfaceElevated: z.ZodDefault<z.ZodString>;
        text: z.ZodDefault<z.ZodString>;
        textMuted: z.ZodDefault<z.ZodString>;
        textSubtle: z.ZodDefault<z.ZodString>;
        textInverse: z.ZodDefault<z.ZodString>;
        border: z.ZodDefault<z.ZodString>;
        borderLight: z.ZodDefault<z.ZodString>;
        borderFocus: z.ZodDefault<z.ZodString>;
        accent: z.ZodDefault<z.ZodString>;
        success: z.ZodDefault<z.ZodString>;
        warning: z.ZodDefault<z.ZodString>;
        error: z.ZodDefault<z.ZodString>;
        info: z.ZodDefault<z.ZodString>;
        gradients: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        text: string;
        border: string;
        primary: string;
        primaryHover: string;
        primaryActive: string;
        primaryForeground: string;
        secondary: string;
        secondaryForeground: string;
        background: string;
        surface: string;
        surfaceCard: string;
        surfaceElevated: string;
        textMuted: string;
        textSubtle: string;
        textInverse: string;
        borderLight: string;
        borderFocus: string;
        accent: string;
        success: string;
        warning: string;
        error: string;
        info: string;
        gradients: Record<string, string>;
    }, {
        text?: string | undefined;
        border?: string | undefined;
        primary?: string | undefined;
        primaryHover?: string | undefined;
        primaryActive?: string | undefined;
        primaryForeground?: string | undefined;
        secondary?: string | undefined;
        secondaryForeground?: string | undefined;
        background?: string | undefined;
        surface?: string | undefined;
        surfaceCard?: string | undefined;
        surfaceElevated?: string | undefined;
        textMuted?: string | undefined;
        textSubtle?: string | undefined;
        textInverse?: string | undefined;
        borderLight?: string | undefined;
        borderFocus?: string | undefined;
        accent?: string | undefined;
        success?: string | undefined;
        warning?: string | undefined;
        error?: string | undefined;
        info?: string | undefined;
        gradients?: Record<string, string> | undefined;
    }>;
    typography: z.ZodObject<{
        fontFamilies: z.ZodObject<{
            sans: z.ZodDefault<z.ZodString>;
            serif: z.ZodDefault<z.ZodString>;
            mono: z.ZodDefault<z.ZodString>;
            display: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            display: string;
            sans: string;
            serif: string;
            mono: string;
        }, {
            display?: string | undefined;
            sans?: string | undefined;
            serif?: string | undefined;
            mono?: string | undefined;
        }>;
        fontSizes: z.ZodObject<{
            xs: z.ZodDefault<z.ZodString>;
            sm: z.ZodDefault<z.ZodString>;
            base: z.ZodDefault<z.ZodString>;
            md: z.ZodDefault<z.ZodString>;
            lg: z.ZodDefault<z.ZodString>;
            xl: z.ZodDefault<z.ZodString>;
            "2xl": z.ZodDefault<z.ZodString>;
            "3xl": z.ZodDefault<z.ZodString>;
            "4xl": z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            xs: string;
            sm: string;
            base: string;
            md: string;
            lg: string;
            xl: string;
            "2xl": string;
            "3xl": string;
            "4xl": string;
        }, {
            xs?: string | undefined;
            sm?: string | undefined;
            base?: string | undefined;
            md?: string | undefined;
            lg?: string | undefined;
            xl?: string | undefined;
            "2xl"?: string | undefined;
            "3xl"?: string | undefined;
            "4xl"?: string | undefined;
        }>;
        fontWeights: z.ZodObject<{
            normal: z.ZodDefault<z.ZodNumber>;
            medium: z.ZodDefault<z.ZodNumber>;
            semibold: z.ZodDefault<z.ZodNumber>;
            bold: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            normal: number;
            medium: number;
            semibold: number;
            bold: number;
        }, {
            normal?: number | undefined;
            medium?: number | undefined;
            semibold?: number | undefined;
            bold?: number | undefined;
        }>;
        lineHeights: z.ZodObject<{
            tight: z.ZodDefault<z.ZodNumber>;
            normal: z.ZodDefault<z.ZodNumber>;
            relaxed: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            normal: number;
            tight: number;
            relaxed: number;
        }, {
            normal?: number | undefined;
            tight?: number | undefined;
            relaxed?: number | undefined;
        }>;
        letterSpacings: z.ZodObject<{
            tight: z.ZodDefault<z.ZodString>;
            normal: z.ZodDefault<z.ZodString>;
            wide: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            normal: string;
            tight: string;
            wide: string;
        }, {
            normal?: string | undefined;
            tight?: string | undefined;
            wide?: string | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        fontFamilies: {
            display: string;
            sans: string;
            serif: string;
            mono: string;
        };
        fontSizes: {
            xs: string;
            sm: string;
            base: string;
            md: string;
            lg: string;
            xl: string;
            "2xl": string;
            "3xl": string;
            "4xl": string;
        };
        fontWeights: {
            normal: number;
            medium: number;
            semibold: number;
            bold: number;
        };
        lineHeights: {
            normal: number;
            tight: number;
            relaxed: number;
        };
        letterSpacings: {
            normal: string;
            tight: string;
            wide: string;
        };
    }, {
        fontFamilies: {
            display?: string | undefined;
            sans?: string | undefined;
            serif?: string | undefined;
            mono?: string | undefined;
        };
        fontSizes: {
            xs?: string | undefined;
            sm?: string | undefined;
            base?: string | undefined;
            md?: string | undefined;
            lg?: string | undefined;
            xl?: string | undefined;
            "2xl"?: string | undefined;
            "3xl"?: string | undefined;
            "4xl"?: string | undefined;
        };
        fontWeights: {
            normal?: number | undefined;
            medium?: number | undefined;
            semibold?: number | undefined;
            bold?: number | undefined;
        };
        lineHeights: {
            normal?: number | undefined;
            tight?: number | undefined;
            relaxed?: number | undefined;
        };
        letterSpacings: {
            normal?: string | undefined;
            tight?: string | undefined;
            wide?: string | undefined;
        };
    }>;
    spacing: z.ZodObject<{
        scale: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        scale: Record<string, string>;
    }, {
        scale?: Record<string, string> | undefined;
    }>;
    radius: z.ZodObject<{
        none: z.ZodDefault<z.ZodString>;
        sm: z.ZodDefault<z.ZodString>;
        md: z.ZodDefault<z.ZodString>;
        lg: z.ZodDefault<z.ZodString>;
        xl: z.ZodDefault<z.ZodString>;
        full: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        none: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        full: string;
    }, {
        none?: string | undefined;
        sm?: string | undefined;
        md?: string | undefined;
        lg?: string | undefined;
        xl?: string | undefined;
        full?: string | undefined;
    }>;
    shadows: z.ZodObject<{
        none: z.ZodDefault<z.ZodString>;
        sm: z.ZodDefault<z.ZodString>;
        md: z.ZodDefault<z.ZodString>;
        lg: z.ZodDefault<z.ZodString>;
        xl: z.ZodDefault<z.ZodString>;
        inner: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        none: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        inner: string;
    }, {
        none?: string | undefined;
        sm?: string | undefined;
        md?: string | undefined;
        lg?: string | undefined;
        xl?: string | undefined;
        inner?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    colors: {
        text: string;
        border: string;
        primary: string;
        primaryHover: string;
        primaryActive: string;
        primaryForeground: string;
        secondary: string;
        secondaryForeground: string;
        background: string;
        surface: string;
        surfaceCard: string;
        surfaceElevated: string;
        textMuted: string;
        textSubtle: string;
        textInverse: string;
        borderLight: string;
        borderFocus: string;
        accent: string;
        success: string;
        warning: string;
        error: string;
        info: string;
        gradients: Record<string, string>;
    };
    typography: {
        fontFamilies: {
            display: string;
            sans: string;
            serif: string;
            mono: string;
        };
        fontSizes: {
            xs: string;
            sm: string;
            base: string;
            md: string;
            lg: string;
            xl: string;
            "2xl": string;
            "3xl": string;
            "4xl": string;
        };
        fontWeights: {
            normal: number;
            medium: number;
            semibold: number;
            bold: number;
        };
        lineHeights: {
            normal: number;
            tight: number;
            relaxed: number;
        };
        letterSpacings: {
            normal: string;
            tight: string;
            wide: string;
        };
    };
    spacing: {
        scale: Record<string, string>;
    };
    radius: {
        none: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        full: string;
    };
    shadows: {
        none: string;
        sm: string;
        md: string;
        lg: string;
        xl: string;
        inner: string;
    };
}, {
    colors: {
        text?: string | undefined;
        border?: string | undefined;
        primary?: string | undefined;
        primaryHover?: string | undefined;
        primaryActive?: string | undefined;
        primaryForeground?: string | undefined;
        secondary?: string | undefined;
        secondaryForeground?: string | undefined;
        background?: string | undefined;
        surface?: string | undefined;
        surfaceCard?: string | undefined;
        surfaceElevated?: string | undefined;
        textMuted?: string | undefined;
        textSubtle?: string | undefined;
        textInverse?: string | undefined;
        borderLight?: string | undefined;
        borderFocus?: string | undefined;
        accent?: string | undefined;
        success?: string | undefined;
        warning?: string | undefined;
        error?: string | undefined;
        info?: string | undefined;
        gradients?: Record<string, string> | undefined;
    };
    typography: {
        fontFamilies: {
            display?: string | undefined;
            sans?: string | undefined;
            serif?: string | undefined;
            mono?: string | undefined;
        };
        fontSizes: {
            xs?: string | undefined;
            sm?: string | undefined;
            base?: string | undefined;
            md?: string | undefined;
            lg?: string | undefined;
            xl?: string | undefined;
            "2xl"?: string | undefined;
            "3xl"?: string | undefined;
            "4xl"?: string | undefined;
        };
        fontWeights: {
            normal?: number | undefined;
            medium?: number | undefined;
            semibold?: number | undefined;
            bold?: number | undefined;
        };
        lineHeights: {
            normal?: number | undefined;
            tight?: number | undefined;
            relaxed?: number | undefined;
        };
        letterSpacings: {
            normal?: string | undefined;
            tight?: string | undefined;
            wide?: string | undefined;
        };
    };
    spacing: {
        scale?: Record<string, string> | undefined;
    };
    radius: {
        none?: string | undefined;
        sm?: string | undefined;
        md?: string | undefined;
        lg?: string | undefined;
        xl?: string | undefined;
        full?: string | undefined;
    };
    shadows: {
        none?: string | undefined;
        sm?: string | undefined;
        md?: string | undefined;
        lg?: string | undefined;
        xl?: string | undefined;
        inner?: string | undefined;
    };
}>;
export type DesignTokens = z.infer<typeof DesignTokensSchema>;
//# sourceMappingURL=tokens.d.ts.map