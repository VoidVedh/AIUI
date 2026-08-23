import { z } from "zod";
export declare const ComponentPropSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodString;
    required: z.ZodDefault<z.ZodBoolean>;
    defaultValue: z.ZodOptional<z.ZodAny>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    name: string;
    required: boolean;
    defaultValue?: any;
    description?: string | undefined;
}, {
    type: string;
    name: string;
    required?: boolean | undefined;
    defaultValue?: any;
    description?: string | undefined;
}>;
export type ComponentProp = z.infer<typeof ComponentPropSchema>;
export declare const ComponentPlanNodeSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    category: z.ZodEnum<["layout", "navigation", "feedback", "data-display", "input", "atomic", "section"]>;
    irNodeIds: z.ZodArray<z.ZodString, "many">;
    isReusable: z.ZodDefault<z.ZodBoolean>;
    filePath: z.ZodString;
    props: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        required: z.ZodDefault<z.ZodBoolean>;
        defaultValue: z.ZodOptional<z.ZodAny>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        required: boolean;
        defaultValue?: any;
        description?: string | undefined;
    }, {
        type: string;
        name: string;
        required?: boolean | undefined;
        defaultValue?: any;
        description?: string | undefined;
    }>, "many">>;
    childComponentIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    stateVariables: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        initialValue: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        initialValue: string;
    }, {
        type: string;
        name: string;
        initialValue: string;
    }>, "many">>;
    stylingStrategy: z.ZodDefault<z.ZodEnum<["css-custom-props", "css-modules", "inline-styles"]>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    category: "section" | "input" | "layout" | "navigation" | "feedback" | "data-display" | "atomic";
    irNodeIds: string[];
    isReusable: boolean;
    filePath: string;
    props: {
        type: string;
        name: string;
        required: boolean;
        defaultValue?: any;
        description?: string | undefined;
    }[];
    childComponentIds: string[];
    stateVariables: {
        type: string;
        name: string;
        initialValue: string;
    }[];
    stylingStrategy: "css-custom-props" | "css-modules" | "inline-styles";
}, {
    id: string;
    name: string;
    category: "section" | "input" | "layout" | "navigation" | "feedback" | "data-display" | "atomic";
    irNodeIds: string[];
    filePath: string;
    isReusable?: boolean | undefined;
    props?: {
        type: string;
        name: string;
        required?: boolean | undefined;
        defaultValue?: any;
        description?: string | undefined;
    }[] | undefined;
    childComponentIds?: string[] | undefined;
    stateVariables?: {
        type: string;
        name: string;
        initialValue: string;
    }[] | undefined;
    stylingStrategy?: "css-custom-props" | "css-modules" | "inline-styles" | undefined;
}>;
export type ComponentPlanNode = z.infer<typeof ComponentPlanNodeSchema>;
export declare const ComponentPlanSchema: z.ZodObject<{
    rootComponentId: z.ZodString;
    components: z.ZodRecord<z.ZodString, z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        category: z.ZodEnum<["layout", "navigation", "feedback", "data-display", "input", "atomic", "section"]>;
        irNodeIds: z.ZodArray<z.ZodString, "many">;
        isReusable: z.ZodDefault<z.ZodBoolean>;
        filePath: z.ZodString;
        props: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            required: z.ZodDefault<z.ZodBoolean>;
            defaultValue: z.ZodOptional<z.ZodAny>;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            name: string;
            required: boolean;
            defaultValue?: any;
            description?: string | undefined;
        }, {
            type: string;
            name: string;
            required?: boolean | undefined;
            defaultValue?: any;
            description?: string | undefined;
        }>, "many">>;
        childComponentIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        stateVariables: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            initialValue: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: string;
            name: string;
            initialValue: string;
        }, {
            type: string;
            name: string;
            initialValue: string;
        }>, "many">>;
        stylingStrategy: z.ZodDefault<z.ZodEnum<["css-custom-props", "css-modules", "inline-styles"]>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        category: "section" | "input" | "layout" | "navigation" | "feedback" | "data-display" | "atomic";
        irNodeIds: string[];
        isReusable: boolean;
        filePath: string;
        props: {
            type: string;
            name: string;
            required: boolean;
            defaultValue?: any;
            description?: string | undefined;
        }[];
        childComponentIds: string[];
        stateVariables: {
            type: string;
            name: string;
            initialValue: string;
        }[];
        stylingStrategy: "css-custom-props" | "css-modules" | "inline-styles";
    }, {
        id: string;
        name: string;
        category: "section" | "input" | "layout" | "navigation" | "feedback" | "data-display" | "atomic";
        irNodeIds: string[];
        filePath: string;
        isReusable?: boolean | undefined;
        props?: {
            type: string;
            name: string;
            required?: boolean | undefined;
            defaultValue?: any;
            description?: string | undefined;
        }[] | undefined;
        childComponentIds?: string[] | undefined;
        stateVariables?: {
            type: string;
            name: string;
            initialValue: string;
        }[] | undefined;
        stylingStrategy?: "css-custom-props" | "css-modules" | "inline-styles" | undefined;
    }>>;
    entryFile: z.ZodDefault<z.ZodString>;
    sharedStylesFile: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    rootComponentId: string;
    components: Record<string, {
        id: string;
        name: string;
        category: "section" | "input" | "layout" | "navigation" | "feedback" | "data-display" | "atomic";
        irNodeIds: string[];
        isReusable: boolean;
        filePath: string;
        props: {
            type: string;
            name: string;
            required: boolean;
            defaultValue?: any;
            description?: string | undefined;
        }[];
        childComponentIds: string[];
        stateVariables: {
            type: string;
            name: string;
            initialValue: string;
        }[];
        stylingStrategy: "css-custom-props" | "css-modules" | "inline-styles";
    }>;
    entryFile: string;
    sharedStylesFile: string;
}, {
    rootComponentId: string;
    components: Record<string, {
        id: string;
        name: string;
        category: "section" | "input" | "layout" | "navigation" | "feedback" | "data-display" | "atomic";
        irNodeIds: string[];
        filePath: string;
        isReusable?: boolean | undefined;
        props?: {
            type: string;
            name: string;
            required?: boolean | undefined;
            defaultValue?: any;
            description?: string | undefined;
        }[] | undefined;
        childComponentIds?: string[] | undefined;
        stateVariables?: {
            type: string;
            name: string;
            initialValue: string;
        }[] | undefined;
        stylingStrategy?: "css-custom-props" | "css-modules" | "inline-styles" | undefined;
    }>;
    entryFile?: string | undefined;
    sharedStylesFile?: string | undefined;
}>;
export type ComponentPlan = z.infer<typeof ComponentPlanSchema>;
//# sourceMappingURL=planner.d.ts.map