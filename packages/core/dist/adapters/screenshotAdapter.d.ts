import { UIIRDocument } from "../types/ir.js";
import { AdapterInput, InputAdapter } from "./types.js";
export declare class ScreenshotInputAdapter implements InputAdapter {
    readonly supportedType: "screenshot";
    parse(input: AdapterInput): Promise<UIIRDocument>;
}
//# sourceMappingURL=screenshotAdapter.d.ts.map