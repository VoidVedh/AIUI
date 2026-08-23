import archiver from "archiver";
export class ZipService {
    /**
     * Streams a GeneratedProject as a zip archive into an Express HTTP response.
     */
    static streamProjectZip(project, projectName, res) {
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
//# sourceMappingURL=zipService.js.map