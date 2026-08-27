import { UIIRDocument, UINode } from "../types/ir.js";
export interface ExtractedColorSummary {
    dominantBg: string;
    surfaceBg: string;
    primaryAccent: string;
    textColor: string;
    mutedColor: string;
}
export declare class CvExtractor {
    /**
     * Performs real computer vision pixel analysis on an image buffer and constructs a canonical UIIRDocument.
     */
    static extractFromImageBuffer(buffer: Buffer, name?: string, viewportHint?: {
        width: number;
        height: number;
    }): Promise<UIIRDocument>;
    /**
     * Scans raw PNG pixel data to extract color palettes and spatial region topology.
     */
    private static analyzePixelBuffer;
    private static rgbToHex;
    /**
     * Deterministically constructs a UIIRDocument from an image analysis summary or template metadata.
     */
    static extractFromSummary(name: string, width: number, height: number, colors: ExtractedColorSummary, sections: {
        type: "navbar" | "hero" | "card-grid" | "form" | "dashboard" | "mobile" | "dense-matrix";
        title?: string;
        subtitle?: string;
        actionText?: string;
        items?: any[];
    }[]): UIIRDocument;
    /**
     * Constructs a canonical two-panel split layout (e.g. hero left panel + auth form right panel).
     */
    static buildTwoPanelSplit(nodes: Record<string, UINode>, rootId: string, colors: ExtractedColorSummary, leftDark: boolean, viewport: {
        width: number;
        height: number;
    }, customCopy?: {
        heroHeadline?: string;
        heroSubtitle?: string;
        formTitle?: string;
    }): void;
    private static buildMobileRoot;
    private static buildDenseMatrixRoot;
    private static buildDashboardRoot;
    private static buildFormRoot;
    private static buildLandingRoot;
    private static buildNavbar;
    private static buildHero;
    private static buildCardGrid;
    private static buildForm;
    private static buildDashboard;
    private static buildMobile;
    private static buildDenseMatrix;
}
//# sourceMappingURL=cvExtractor.d.ts.map