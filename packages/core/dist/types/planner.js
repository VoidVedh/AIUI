import { z } from "zod";
export const ComponentPropSchema = z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean().default(false),
    defaultValue: z.any().optional(),
    description: z.string().optional(),
});
export const ComponentPlanNodeSchema = z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum(["layout", "navigation", "feedback", "data-display", "input", "atomic", "section"]),
    irNodeIds: z.array(z.string()),
    isReusable: z.boolean().default(false),
    filePath: z.string(),
    props: z.array(ComponentPropSchema).default([]),
    childComponentIds: z.array(z.string()).default([]),
    stateVariables: z.array(z.object({
        name: z.string(),
        type: z.string(),
        initialValue: z.string(),
    })).default([]),
    stylingStrategy: z.enum(["css-custom-props", "css-modules", "inline-styles"]).default("css-custom-props"),
});
export const ComponentPlanSchema = z.object({
    rootComponentId: z.string(),
    components: z.record(ComponentPlanNodeSchema),
    entryFile: z.string().default("src/App.jsx"),
    sharedStylesFile: z.string().default("src/index.css"),
});
//# sourceMappingURL=planner.js.map