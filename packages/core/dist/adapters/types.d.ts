import { UIIRDocument } from "../types/ir.js";
export interface AdapterInput {
    type: "screenshot" | "figma";
    data: Buffer | string;
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
//# sourceMappingURL=types.d.ts.map