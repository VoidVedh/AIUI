import { GeneratedProject } from "@aiui/core";
import { Response } from "express";
export declare class ZipService {
    /**
     * Streams a GeneratedProject as a zip archive into an Express HTTP response.
     */
    static streamProjectZip(project: GeneratedProject, projectName: string, res: Response): void;
    /**
     * Generates a zip archive Buffer in-memory.
     */
    static createProjectZip(project: GeneratedProject): Promise<Buffer>;
}
//# sourceMappingURL=zipService.d.ts.map