import { UIIRDocument } from "../types/ir.js";

export interface AdapterInput {
  type: "screenshot" | "figma";
  data: Buffer | string; // Image buffer or Figma JSON string
  mimeType?: string;
  name?: string;
  viewportHint?: {
    width: number;
    height: number;
  };
}

export interface InputAdapter {
  readonly supportedType: "screenshot" | "figma";
  parse(input: AdapterInput): Promise<UIIRDocument>;
}
