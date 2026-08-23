import archiver from "archiver";
import { GeneratedProject } from "@aiui/core";
import { Response } from "express";

export class ZipService {
  /**
   * Streams a GeneratedProject as a zip archive into an Express HTTP response.
   */
  public static streamProjectZip(project: GeneratedProject, projectName: string, res: Response): void {
    const archive = archiver("zip", { zlib: { level: 9 } });

    res.attachment(`${projectName}.zip`);
    res.setHeader("Content-Type", "application/zip");

    archive.on("error", (err) => {
      res.status(500).send({ error: err.message });
    });

    archive.pipe(res);

    for (const file of project.files) {
      archive.append(file.content, { name: file.path });
    }

    archive.finalize();
  }
}
