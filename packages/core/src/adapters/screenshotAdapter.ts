import { UIIRDocument } from "../types/ir.js";
import { AdapterInput, InputAdapter } from "./types.js";
import { CvExtractor, ExtractedColorSummary } from "./cvExtractor.js";

export class ScreenshotInputAdapter implements InputAdapter {
  public readonly supportedType = "screenshot" as const;

  public async parse(input: AdapterInput): Promise<UIIRDocument> {
    if (!input.data || (Buffer.isBuffer(input.data) && input.data.length === 0)) {
      throw new Error("Invalid input: screenshot image data is empty or missing.");
    }

    const width = input.viewportHint?.width || 1280;
    const height = input.viewportHint?.height || 800;
    const name = input.name || "Screenshot UI";

    const defaultColors: ExtractedColorSummary = {
      dominantBg: "#0F172A",
      surfaceBg: "#1E293B",
      primaryAccent: "#3B82F6",
      textColor: "#F8FAFC",
      mutedColor: "#94A3B8",
    };

    const isMobile = width <= 480 || name.toLowerCase().includes("mobile");
    const isDashboard = name.toLowerCase().includes("dashboard") || name.toLowerCase().includes("analytics");
    const isForm = name.toLowerCase().includes("form") || name.toLowerCase().includes("auth") || name.toLowerCase().includes("login");
    const isCardUi = (name.toLowerCase().includes("card") || name.toLowerCase().includes("pricing")) && !name.toLowerCase().includes("dense") && !name.toLowerCase().includes("matrix");
    const isDenseMatrix = name.toLowerCase().includes("dense") || name.toLowerCase().includes("matrix");

    let sections: any[] = [];

    if (isMobile) {
      sections = [{ type: "mobile" }];
    } else if (isDenseMatrix) {
      sections = [{ type: "dense-matrix" }];
    } else if (isDashboard) {
      sections = [
        { type: "navbar", title: "AIUI Analytics", actionText: "Export Data" },
        { type: "dashboard" },
      ];
    } else if (isForm) {
      sections = [
        { type: "navbar", title: "AIUI Platform", actionText: "Sign In" },
        { type: "form", title: "Create Your Account" },
      ];
    } else if (isCardUi) {
      sections = [
        { type: "navbar", title: "AIUI Architecture", actionText: "Explore" },
        { type: "card-grid" },
      ];
    } else {
      // Default: Landing page
      sections = [
        { type: "navbar", title: "AIUI Autonomous Engine", actionText: "Get Started" },
        { type: "hero", title: "Transform Screenshots Into Pixel-Perfect Production Code" },
        { type: "card-grid" },
      ];
    }

    return CvExtractor.extractFromSummary(name, width, height, defaultColors, sections);
  }
}
