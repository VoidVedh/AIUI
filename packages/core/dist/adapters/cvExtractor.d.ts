import { PNG } from "pngjs";
import { UIIRDocument, UINodeType } from "../types/ir.js";
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
    bbox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
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
export declare class CvExtractor {
    /**
     * Performs computer vision pixel analysis on an image buffer and constructs a generic UIIRDocument.
     * Zero hardcoded templates or fixture-specific copy.
     */
    static extractFromImageBuffer(buffer: Buffer, name?: string, viewportHint?: {
        width: number;
        height: number;
    }): Promise<UIIRDocument>;
    /**
     * Scans raw PNG pixel data to extract color palettes and spatial region topology.
     */
    static analyzePixelBuffer(png: PNG): {
        colors: {
            dominantBg: string;
            surfaceBg: string;
            primaryAccent: string;
            textColor: string;
            mutedColor: string;
        };
        leftLuminance: number;
        rightLuminance: number;
        isSplitLayout: boolean;
        leftDark: boolean;
        isMobile: boolean;
    };
    static rgbToHex(r: number, g: number, b: number): string;
    /**
     * Constructs a UIIRDocument generically from section summaries.
     */
    static extractFromSummary(name: string, width: number, height: number, colors: ExtractedColorSummary, sections: {
        type: string;
        title?: string;
        subtitle?: string;
        actionText?: string;
        items?: any[];
    }[]): UIIRDocument;
    /**
     * Generic recursive tree walker converting open perception nodes into canonical UINodes.
     */
    static buildFromPerceptionTree(rootPerception: PerceptionNode, docName: string, viewport: {
        width: number;
        height: number;
    }, palette: ExtractedColorSummary): UIIRDocument;
    private static walkPerceptionNode;
    static mapRoleToNodeType(role?: string): UINodeType;
    private static buildGenericLayout;
    private static buildGenericSplitLayout;
    private static buildGenericMobileLayout;
}
//# sourceMappingURL=cvExtractor.d.ts.map