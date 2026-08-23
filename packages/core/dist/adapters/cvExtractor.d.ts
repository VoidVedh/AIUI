import { UIIRDocument } from "../types/ir.js";
export interface ExtractedColorSummary {
    dominantBg: string;
    surfaceBg: string;
    primaryAccent: string;
    textColor: string;
    mutedColor: string;
}
export declare class CvExtractor {
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
    private static buildNavbar;
    private static buildHero;
    private static buildCardGrid;
    private static buildForm;
    private static buildDashboard;
    private static buildMobile;
    private static buildDenseMatrix;
}
//# sourceMappingURL=cvExtractor.d.ts.map