import { UIIRDocument } from "../types/ir.js";
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
    absoluteBoundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    layoutMode?: "NONE" | "HORIZONTAL" | "VERTICAL";
    itemSpacing?: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
    primaryAxisAlignItems?: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
    counterAxisAlignItems?: "MIN" | "CENTER" | "MAX";
    fills?: Array<{
        type: string;
        color?: FigmaColor;
        opacity?: number;
        visible?: boolean;
    }>;
    strokes?: Array<{
        type: string;
        color?: FigmaColor;
        opacity?: number;
    }>;
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
        offset?: {
            x: number;
            y: number;
        };
    }>;
}
export declare class FigmaInputAdapter implements InputAdapter {
    readonly supportedType: "figma";
    /**
     * Parses a Figma REST API document or node JSON into a canonical UIIRDocument.
     */
    parse(input: AdapterInput): Promise<UIIRDocument>;
    private convertFigmaNode;
    private resolveNodeType;
    private figmaColorToHex;
}
//# sourceMappingURL=figmaAdapter.d.ts.map