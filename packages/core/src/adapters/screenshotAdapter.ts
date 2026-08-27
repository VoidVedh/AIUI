import { UIIRDocument } from "../types/ir.js";
import { AdapterInput, InputAdapter } from "./types.js";
import { CvExtractor } from "./cvExtractor.js";

export class ScreenshotInputAdapter implements InputAdapter {
  public readonly supportedType = "screenshot" as const;

  public async parse(input: AdapterInput): Promise<UIIRDocument> {
    if (!input.data || (Buffer.isBuffer(input.data) && input.data.length === 0)) {
      throw new Error("Invalid input: screenshot image data is empty or missing.");
    }

    const buffer = Buffer.isBuffer(input.data)
      ? input.data
      : Buffer.from(String(input.data), "base64");

    return CvExtractor.extractFromImageBuffer(
      buffer,
      input.name,
      input.viewportHint
    );
  }
}
