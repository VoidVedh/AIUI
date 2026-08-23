import { z } from "zod";
export declare const GeneratedFileSchema: z.ZodObject<{
    path: z.ZodString;
    content: z.ZodString;
    isEntry: z.ZodDefault<z.ZodBoolean>;
    language: z.ZodEnum<["javascript", "typescript", "jsx", "tsx", "html", "css", "dart", "json"]>;
}, "strip", z.ZodTypeAny, {
    path: string;
    content: string;
    isEntry: boolean;
    language: "javascript" | "typescript" | "jsx" | "tsx" | "html" | "css" | "dart" | "json";
}, {
    path: string;
    content: string;
    language: "javascript" | "typescript" | "jsx" | "tsx" | "html" | "css" | "dart" | "json";
    isEntry?: boolean | undefined;
}>;
export type GeneratedFile = z.infer<typeof GeneratedFileSchema>;
export declare const GeneratedProjectSchema: z.ZodObject<{
    target: z.ZodEnum<["react", "vanillajs", "flutter"]>;
    files: z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        content: z.ZodString;
        isEntry: z.ZodDefault<z.ZodBoolean>;
        language: z.ZodEnum<["javascript", "typescript", "jsx", "tsx", "html", "css", "dart", "json"]>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        content: string;
        isEntry: boolean;
        language: "javascript" | "typescript" | "jsx" | "tsx" | "html" | "css" | "dart" | "json";
    }, {
        path: string;
        content: string;
        language: "javascript" | "typescript" | "jsx" | "tsx" | "html" | "css" | "dart" | "json";
        isEntry?: boolean | undefined;
    }>, "many">;
    entryFile: z.ZodString;
    staticAssets: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    dependencies: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    entryFile: string;
    target: "react" | "vanillajs" | "flutter";
    files: {
        path: string;
        content: string;
        isEntry: boolean;
        language: "javascript" | "typescript" | "jsx" | "tsx" | "html" | "css" | "dart" | "json";
    }[];
    staticAssets: Record<string, string>;
    dependencies: Record<string, string>;
}, {
    entryFile: string;
    target: "react" | "vanillajs" | "flutter";
    files: {
        path: string;
        content: string;
        language: "javascript" | "typescript" | "jsx" | "tsx" | "html" | "css" | "dart" | "json";
        isEntry?: boolean | undefined;
    }[];
    staticAssets?: Record<string, string> | undefined;
    dependencies?: Record<string, string> | undefined;
}>;
export type GeneratedProject = z.infer<typeof GeneratedProjectSchema>;
//# sourceMappingURL=generator.d.ts.map