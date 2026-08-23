import { z } from "zod";

export const GeneratedFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  isEntry: z.boolean().default(false),
  language: z.enum(["javascript", "typescript", "jsx", "tsx", "html", "css", "dart", "json"]),
});

export type GeneratedFile = z.infer<typeof GeneratedFileSchema>;

export const GeneratedProjectSchema = z.object({
  target: z.enum(["react", "vanillajs", "flutter"]),
  files: z.array(GeneratedFileSchema),
  entryFile: z.string(),
  staticAssets: z.record(z.string()).default({}),
  dependencies: z.record(z.string()).default({}),
});

export type GeneratedProject = z.infer<typeof GeneratedProjectSchema>;
